import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { FiCamera, FiRefreshCw, FiSend } from "react-icons/fi";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import LoadingPulse from "../components/LoadingPulse";

const videoConstraints = {
  facingMode: "user",
};

export default function RegisterFacePage() {
  const { showError, showInfo, showSuccess } = useToast();
  const webcamRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [captures, setCaptures] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = async () => {
    setError("");
    setProfileLoading(true);
    try {
      const { data } = await API.get("/student/me");
      setProfile(data.student);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load profile";
      setError(message);
      showError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const canRegister = profile && (profile.faceImages.length === 0 || profile.allowFaceReregistration);

  const capture = () => {
    const image = webcamRef.current?.getScreenshot();
    if (!image) return;
    if (captures.length >= 5) return;
    setCaptures((prev) => [...prev, image]);
  };

  const submitFaces = async () => {
    if (captures.length !== 5) {
      const message = "Please capture exactly 5 face images before submitting.";
      setError(message);
      showInfo(message);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await API.post("/student/face/register", { images: captures });
      setMessage(data.message);
      showSuccess(data.message || "Face ID registration completed");
      setCaptures([]);
      await loadProfile();
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const validationMessage = err.response?.data?.errors?.[0]?.msg;
      const messageText = apiMessage || validationMessage || "Failed to register faces";
      setError(messageText);
      showError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const requestChange = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await API.post("/student/face/change-request", { type: "FACE_ID_CHANGE" });
      setMessage(data.message);
      showSuccess(data.message || "Request submitted");
    } catch (err) {
      const messageText = err.response?.data?.message || "Failed to submit request";
      setError(messageText);
      showError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="section-header">
        <h2>Face ID</h2>
      </div>
      {error && <p className="error-text">{error}</p>}
      {message && <p>{message}</p>}

      {profileLoading ? <LoadingPulse label="Loading face profile..." /> : null}

      {profile && (
        <p className="muted">
          Registered images: {profile.faceImages.length}/5
          {profile.allowFaceReregistration ? " (Admin approved re-registration)" : ""}
        </p>
      )}

      {profile?.faceImages?.length > 0 ? (
        <div>
          <h3>Registered Face Images</h3>
          <div className="thumb-grid">
            {profile.faceImages.slice(0, 5).map((img, idx) => (
              <img key={idx} src={img} alt={`registered-${idx}`} />
            ))}
          </div>
        </div>
      ) : null}

      {canRegister ? (
        <>
          <div className="webcam-wrap">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              audio={false}
            />
          </div>
          <div className="row-actions">
            <button className="btn" type="button" onClick={capture} disabled={captures.length >= 5}>
              <FiCamera />Capture Image ({captures.length}/5)
            </button>
            <button className="btn" type="button" onClick={() => setCaptures([])}>
              <FiRefreshCw />Clear
            </button>
            <button
              className="btn"
              type="button"
              onClick={submitFaces}
              disabled={captures.length !== 5 || loading}
            >
              {loading ? "Submitting..." : <><FiSend />Submit 5 Images</>}
            </button>
          </div>

          <div className="thumb-grid">
            {captures.map((img, idx) => (
              <img key={idx} src={img} alt={`capture-${idx}`} />
            ))}
          </div>
        </>
      ) : (
        <div className="row-actions">
          <p className="muted">Face ID already registered. Request admin approval to change Face ID.</p>
          <button className="btn" type="button" onClick={requestChange} disabled={loading}>
            <FiSend />Request Face ID Change
          </button>
        </div>
      )}
    </section>
  );
}