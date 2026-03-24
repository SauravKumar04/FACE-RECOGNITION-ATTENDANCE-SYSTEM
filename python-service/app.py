"""Face recognition microservice using InsightFace (RetinaFace + ArcFace)."""

import base64
import io
import logging
import os
import shutil

import cv2
import numpy as np
from PIL import Image
from flask import Flask, jsonify, request
from flask_cors import CORS
from insightface.app import FaceAnalysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FACES_DIR = os.path.join(BASE_DIR, "registered_faces")
os.makedirs(FACES_DIR, exist_ok=True)

SIMILARITY_THRESHOLD = 0.40
MIN_MATCHES = 2
MIN_GAP = 0.03
VERIFY_SIMILARITY_THRESHOLD = 0.48
VERIFY_MIN_MATCHES = 3
MIN_DETECTION_SCORE = 0.60
MIN_FACE_AREA_RATIO = 0.08
MIN_SHARPNESS = 45.0
MIN_BRIGHTNESS = 45.0
MAX_BRIGHTNESS = 210.0

face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=-1, det_size=(640, 640))


def decode_image(base64_str):
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    img_bytes = base64.b64decode(base64_str)
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    rgb = np.array(pil_img)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def cosine_similarity(v1, v2):
    v1_norm = np.linalg.norm(v1)
    v2_norm = np.linalg.norm(v2)
    if v1_norm == 0 or v2_norm == 0:
        return -1.0
    return float(np.dot(v1, v2) / (v1_norm * v2_norm))


def extract_face_data(bgr_img):
    faces = face_app.get(bgr_img)
    if not faces:
        return None, None, None, None

    # Use the largest detected face for registration/recognition.
    best_face = max(
        faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
    )
    embedding = np.asarray(best_face.embedding, dtype=np.float32)
    norm = np.linalg.norm(embedding)
    if norm == 0:
        return None, None, None, None

    bbox = np.asarray(best_face.bbox).astype(int)
    det_score = float(getattr(best_face, "det_score", 0.0))
    return embedding / norm, bbox, det_score, bgr_img


def evaluate_passive_liveness(bgr_img, bbox, det_score):
    h, w = bgr_img.shape[:2]
    x1, y1, x2, y2 = bbox
    x1 = max(0, min(x1, w - 1))
    x2 = max(0, min(x2, w))
    y1 = max(0, min(y1, h - 1))
    y2 = max(0, min(y2, h))

    if x2 <= x1 or y2 <= y1:
        return False, "Invalid face region captured"

    face_area_ratio = ((x2 - x1) * (y2 - y1)) / float(max(1, w * h))
    face_crop = bgr_img[y1:y2, x1:x2]
    gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))

    if det_score < MIN_DETECTION_SCORE:
        return False, "Face not detected confidently. Please align your face with camera."
    if face_area_ratio < MIN_FACE_AREA_RATIO:
        return False, "Move closer so your face fills the frame."
    if sharpness < MIN_SHARPNESS:
        return False, "Image is blurry. Hold still and improve focus."
    if brightness < MIN_BRIGHTNESS or brightness > MAX_BRIGHTNESS:
        return False, "Lighting is not suitable. Adjust light and try again."

    return True, None


def list_embedding_files(emp_dir):
    return sorted(
        [f for f in os.listdir(emp_dir) if f.endswith(".npy") and f.startswith("sample_")]
    )


def load_user_similarities(employee_id, probe_embedding):
    emp_dir = os.path.join(FACES_DIR, str(employee_id))
    if not os.path.isdir(emp_dir):
        return None

    sample_files = list_embedding_files(emp_dir)
    similarities = []
    for sample_file in sample_files:
        sample_path = os.path.join(emp_dir, sample_file)
        try:
            sample_embedding = np.load(sample_path)
            similarities.append(cosine_similarity(probe_embedding, sample_embedding))
        except Exception as e:
            logger.warning("Verify comparison error for %s/%s: %s", employee_id, sample_file, e)

    return similarities


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "face-recognition-insightface"})


@app.route("/register", methods=["POST"])
def register_face():
    try:
        data = request.get_json(silent=True) or {}
        employee_id = data.get("employee_id")
        image_b64 = data.get("image")

        if not employee_id or not image_b64:
            return jsonify({"success": False, "message": "Missing employee_id or image"}), 400

        try:
            bgr_img = decode_image(image_b64)
        except Exception:
            return jsonify({"success": False, "message": "Invalid image data"}), 400

        embedding, bbox, det_score, frame = extract_face_data(bgr_img)
        if embedding is None:
            return jsonify({"success": False, "message": "No face detected in image. Please try again."}), 400

        emp_dir = os.path.join(FACES_DIR, str(employee_id))
        os.makedirs(emp_dir, exist_ok=True)

        sample_files = list_embedding_files(emp_dir)
        sample_count = len(sample_files) + 1
        emb_path = os.path.join(emp_dir, f"sample_{sample_count}.npy")
        np.save(emb_path, embedding)

        total_samples = len(list_embedding_files(emp_dir))
        logger.info("Registered face embedding %s for %s", total_samples, employee_id)

        # Keep response keys compatible with existing clients.
        return jsonify({
            "success": True,
            "message": f"Face sample {total_samples} registered for {employee_id}",
            "total_samples": total_samples,
            "registered_images": [],
        })

    except Exception as e:
        logger.error("Register error: %s", str(e))
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@app.route("/recognize", methods=["POST"])
def recognize_face():
    try:
        data = request.get_json(silent=True) or {}
        image_b64 = data.get("image")

        if not image_b64:
            return jsonify({"success": False, "message": "Missing image"}), 400

        bgr_img = decode_image(image_b64)
        probe_embedding, bbox, det_score, frame = extract_face_data(bgr_img)
        if probe_embedding is None:
            return jsonify({
                "success": False,
                "message": "No clear face detected. Please center your face and improve lighting.",
            }), 400

        is_live, live_message = evaluate_passive_liveness(frame, bbox, det_score)
        if not is_live:
            return jsonify({"success": False, "message": live_message}), 400

        if not os.path.exists(FACES_DIR) or not os.listdir(FACES_DIR):
            return jsonify({"success": False, "message": "No registered employees found"}), 404

        best_employee = None
        best_avg_similarity = -1.0
        second_best_avg_similarity = -1.0
        best_match_count = 0
        best_total = 0

        for employee_id in os.listdir(FACES_DIR):
            emp_dir = os.path.join(FACES_DIR, employee_id)
            if not os.path.isdir(emp_dir):
                continue

            sample_files = list_embedding_files(emp_dir)
            if not sample_files:
                continue

            similarities = []
            match_count = 0
            for sample_file in sample_files:
                sample_path = os.path.join(emp_dir, sample_file)
                try:
                    sample_embedding = np.load(sample_path)
                    sim = cosine_similarity(probe_embedding, sample_embedding)
                    similarities.append(sim)
                    if sim >= SIMILARITY_THRESHOLD:
                        match_count += 1
                except Exception as e:
                    logger.warning("Comparison error for %s/%s: %s", employee_id, sample_file, e)

            if not similarities:
                continue

            avg_similarity = float(sum(similarities) / len(similarities))
            if avg_similarity > best_avg_similarity:
                second_best_avg_similarity = best_avg_similarity
                best_avg_similarity = avg_similarity
                best_employee = employee_id
                best_match_count = match_count
                best_total = len(similarities)
            elif avg_similarity > second_best_avg_similarity:
                second_best_avg_similarity = avg_similarity

        if not best_employee:
            return jsonify({
                "success": False,
                "message": "Face not recognized. Please register or try with better lighting.",
            }), 400

        min_matches_required = min(MIN_MATCHES, best_total)
        if best_match_count < min_matches_required:
            return jsonify({
                "success": False,
                "message": f"Face not clearly recognized (matched {best_match_count}/{best_total} samples). Try again with better lighting.",
            }), 400

        if best_avg_similarity < SIMILARITY_THRESHOLD:
            return jsonify({
                "success": False,
                "message": "Face match not confident enough. Better lighting needed.",
            }), 400

        gap = best_avg_similarity - second_best_avg_similarity if second_best_avg_similarity >= 0 else 1.0
        if gap < MIN_GAP:
            return jsonify({
                "success": False,
                "message": "Face ambiguous - could match multiple people. Please try capturing again.",
            }), 400

        confidence = round(max(0.0, min(1.0, best_avg_similarity)) * 100, 2)
        logger.info(
            "Recognized: %s (avg_similarity=%.4f, matched=%s/%s, confidence=%s%%)",
            best_employee,
            best_avg_similarity,
            best_match_count,
            best_total,
            confidence,
        )
        return jsonify({
            "success": True,
            "employee_id": best_employee,
            "confidence": confidence,
        })

    except Exception as e:
        logger.error("Recognize error: %s", str(e))
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@app.route("/verify-user", methods=["POST"])
def verify_user_face():
    try:
        data = request.get_json(silent=True) or {}
        employee_id = data.get("employee_id")
        image_b64 = data.get("image")

        if not employee_id or not image_b64:
            return jsonify({"success": False, "message": "Missing employee_id or image"}), 400

        bgr_img = decode_image(image_b64)
        probe_embedding, bbox, det_score, frame = extract_face_data(bgr_img)
        if probe_embedding is None:
            return jsonify({
                "success": False,
                "message": "No clear face detected. Please center your face and improve lighting.",
            }), 400

        is_live, live_message = evaluate_passive_liveness(frame, bbox, det_score)
        if not is_live:
            return jsonify({"success": False, "message": live_message}), 400

        similarities = load_user_similarities(employee_id, probe_embedding)
        if similarities is None:
            return jsonify({"success": False, "message": "No registered face samples found for this user"}), 404
        if not similarities:
            return jsonify({"success": False, "message": "No valid face samples found for this user"}), 400

        avg_similarity = float(sum(similarities) / len(similarities))
        min_similarity = float(min(similarities))
        matched = sum(1 for sim in similarities if sim >= VERIFY_SIMILARITY_THRESHOLD)
        min_required = min(VERIFY_MIN_MATCHES, len(similarities))

        if matched < min_required or avg_similarity < VERIFY_SIMILARITY_THRESHOLD or min_similarity < SIMILARITY_THRESHOLD:
            return jsonify({
                "success": False,
                "employee_id": str(employee_id),
                "matched": matched,
                "total_samples": len(similarities),
                "avg_similarity": round(avg_similarity, 4),
                "min_similarity": round(min_similarity, 4),
                "message": "Face does not match logged-in user profile",
            }), 403

        confidence = round(max(0.0, min(1.0, avg_similarity)) * 100, 2)
        return jsonify({
            "success": True,
            "employee_id": str(employee_id),
            "confidence": confidence,
        })

    except Exception as e:
        logger.error("Verify-user error: %s", str(e))
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@app.route("/delete/<employee_id>", methods=["DELETE"])
def delete_face(employee_id):
    emp_dir = os.path.join(FACES_DIR, str(employee_id))
    if os.path.exists(emp_dir):
        shutil.rmtree(emp_dir)
        return jsonify({"success": True, "message": f"Face data deleted for {employee_id}"})
    return jsonify({"success": False, "message": "Employee not found"}), 404


if __name__ == "__main__":
    logger.info("Starting Face Recognition Service (InsightFace ArcFace) on port 5001")
    app.run(host="0.0.0.0", port=5001, debug=True)