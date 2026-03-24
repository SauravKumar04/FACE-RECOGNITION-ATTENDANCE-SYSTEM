"""
Face Recognition Microservice — using DeepFace (no dlib required)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import numpy as np
import base64
import json
import os
import io
from PIL import Image
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

FACES_DIR = "registered_faces"
os.makedirs(FACES_DIR, exist_ok=True)

THRESHOLD = 0.30  # Very strict: 0.30 means ~92%+ confidence needed as minimum


def decode_image(base64_str):
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_bytes = base64.b64decode(base64_str)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return img


def save_image(img, path):
    img.save(path, "JPEG")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "face-recognition-deepface"})


@app.route("/register", methods=["POST"])
def register_face():
    try:
        data = request.get_json()
        employee_id = data.get("employee_id")
        image_b64 = data.get("image")

        if not employee_id or not image_b64:
            return jsonify({"success": False, "message": "Missing employee_id or image"}), 400

        img = decode_image(image_b64)

        emp_dir = os.path.join(FACES_DIR, employee_id)
        os.makedirs(emp_dir, exist_ok=True)

        existing = os.listdir(emp_dir)
        sample_count = len(existing) + 1
        img_path = os.path.join(emp_dir, f"sample_{sample_count}.jpg")
        save_image(img, img_path)

        try:
            DeepFace.extract_faces(img_path=img_path, detector_backend="opencv", enforce_detection=True)
        except Exception:
            os.remove(img_path)
            return jsonify({"success": False, "message": "No face detected in image. Please try again."}), 400

        total_samples = len(os.listdir(emp_dir))
        logger.info(f"Registered face sample {total_samples} for: {employee_id}")

        # Get all registered images and convert to base64
        # Keep only the last 5 samples for memory efficiency
        registered_images = []
        all_samples = sorted([f for f in os.listdir(emp_dir) if f.endswith('.jpg')])
        samples_to_return = all_samples[-5:] if len(all_samples) > 5 else all_samples
        
        for sample_file in samples_to_return:
            sample_path = os.path.join(emp_dir, sample_file)
            with open(sample_path, 'rb') as f:
                img_b64 = base64.b64encode(f.read()).decode('utf-8')
                registered_images.append(img_b64)

        return jsonify({
            "success": True,
            "message": f"Face sample {total_samples} registered for {employee_id}",
            "total_samples": total_samples,
            "registered_images": registered_images
        })

    except Exception as e:
        logger.error(f"Register error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@app.route("/recognize", methods=["POST"])
def recognize_face():
    try:
        data = request.get_json()
        image_b64 = data.get("image")

        if not image_b64:
            return jsonify({"success": False, "message": "Missing image"}), 400

        img = decode_image(image_b64)
        temp_path = "temp_recognize.jpg"
        save_image(img, temp_path)

        if not os.path.exists(FACES_DIR) or not os.listdir(FACES_DIR):
            os.remove(temp_path)
            return jsonify({"success": False, "message": "No registered employees found"}), 404

        # Group results by employee
        employee_distances = {}  # {employee_id: [distances], matched_count: int}
        
        for employee_id in os.listdir(FACES_DIR):
            emp_dir = os.path.join(FACES_DIR, employee_id)
            if not os.path.isdir(emp_dir):
                continue

            employee_distances[employee_id] = {"distances": [], "matched": 0}
            
            for sample_file in os.listdir(emp_dir):
                if not sample_file.endswith(".jpg"):
                    continue

                sample_path = os.path.join(emp_dir, sample_file)
                try:
                    result = DeepFace.verify(
                        img1_path=temp_path,
                        img2_path=sample_path,
                        model_name="VGG-Face",
                        detector_backend="opencv",
                        enforce_detection=False,
                    )
                    distance = result["distance"]
                    employee_distances[employee_id]["distances"].append(distance)
                    
                    # Count matches below threshold
                    if distance < THRESHOLD:
                        employee_distances[employee_id]["matched"] += 1
                        
                except Exception as e:
                    logger.warning(f"Comparison error for {employee_id}/{sample_file}: {e}")
                    continue

        os.remove(temp_path)

        # Calculate average distance for each employee
        best_match_id = None
        best_avg_distance = float("inf")
        second_best_avg_distance = float("inf")
        
        for employee_id, data in employee_distances.items():
            if not data["distances"]:
                continue
                
            avg_distance = sum(data["distances"]) / len(data["distances"])
            
            if avg_distance < best_avg_distance:
                second_best_avg_distance = best_avg_distance
                best_avg_distance = avg_distance
                best_match_id = employee_id
            elif avg_distance < second_best_avg_distance:
                second_best_avg_distance = avg_distance

        # Validate the match
        if not best_match_id:
            return jsonify({
                "success": False,
                "message": "Face not recognized. Please register or try with better lighting."
            }), 400

        best_data = employee_distances[best_match_id]
        min_matches_required = max(2, len(best_data["distances"]) - 2)  # At least 2 or most samples
        
        # Check 1: Must match multiple samples from same person
        if best_data["matched"] < min_matches_required:
            return jsonify({
                "success": False,
                "message": f"Face not clearly recognized (matched {best_data['matched']}/{len(best_data['distances'])} samples). Try again with better lighting."
            }), 400
        
        # Check 2: Best match must be significantly better than 2nd best
        gap = second_best_avg_distance - best_avg_distance
        min_gap = 0.15  # Must be at least 0.15 better than next best
        
        if gap < min_gap:
            return jsonify({
                "success": False,
                "message": "Face ambiguous - could match multiple people. Please try capturing again."
            }), 400
        
        # Check 3: Average distance must still be below threshold
        if best_avg_distance > THRESHOLD:
            return jsonify({
                "success": False,
                "message": f"Face match not confident enough (distance: {best_avg_distance:.3f}). Better lighting needed."
            }), 400

        confidence = round((1 - best_avg_distance) * 100, 2)
        logger.info(f"Recognized: {best_match_id} (avg_distance={best_avg_distance:.3f}, matched={best_data['matched']}/{len(best_data['distances'])}, confidence={confidence}%)")
        
        return jsonify({
            "success": True,
            "employee_id": best_match_id,
            "confidence": confidence
        })

    except Exception as e:
        logger.error(f"Recognize error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    except Exception as e:
        logger.error(f"Recognize error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@app.route("/delete/<employee_id>", methods=["DELETE"])
def delete_face(employee_id):
    import shutil
    emp_dir = os.path.join(FACES_DIR, employee_id)
    if os.path.exists(emp_dir):
        shutil.rmtree(emp_dir)
        return jsonify({"success": True, "message": f"Face data deleted for {employee_id}"})
    return jsonify({"success": False, "message": "Employee not found"}), 404


if __name__ == "__main__":
    logger.info("Starting Face Recognition Service (DeepFace) on port 5001")
    app.run(host="0.0.0.0", port=5001, debug=True)