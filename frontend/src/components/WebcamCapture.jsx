import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { FiCamera, FiRefreshCw } from "react-icons/fi";
import { ImSpinner8 } from "react-icons/im";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

export default function WebcamCapture({ onCapture, loading = false, label = "Capture" }) {
  const webcamRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [camError, setCamError] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCaptured(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => setCaptured(null);

  const submit = () => {
    if (captured) onCapture(captured);
  };

  if (camError) {
    return (
      <div className="empty-state">
        <p>Camera not accessible.</p>
        <p>Please allow camera permission and reload this page.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: "560px", padding: "14px" }}>
      <div className="webcam-card" style={{ position: "relative" }}>
        {!captured ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMediaError={() => setCamError(true)}
              className="w-full"
              mirrored
            />
            <div className="webcam-overlay">
              <div className="webcam-guide" />
            </div>
            <div className="webcam-label">
              Position face in the oval
            </div>
          </>
        ) : (
          <img src={captured} alt="Captured" className="w-full" />
        )}
      </div>

      <div className="row-actions" style={{ width: "100%" }}>
        {!captured ? (
          <button
            onClick={capture}
            className="btn"
            style={{ width: "100%" }}
          >
            <FiCamera size={17} />
            Capture Photo
          </button>
        ) : (
          <>
            <button
              onClick={retake}
              className="btn btn-ghost"
            >
              <FiRefreshCw size={16} />
              Retake
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="btn"
              style={{ flex: 1 }}
            >
              {loading ? (
                <>
                  <ImSpinner8 size={14} className="spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FiCamera size={16} />
                  {label}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}