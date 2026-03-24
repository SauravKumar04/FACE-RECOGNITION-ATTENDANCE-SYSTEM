import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, Loader2 } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-12 gap-3">
        <Camera size={48} className="text-slate-400" />
        <p className="text-slate-600 font-medium">Camera not accessible</p>
        <p className="text-sm text-slate-500">Please allow camera permissions and reload</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera view */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black shadow-xl">
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
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-56 border-2 border-blue-400 rounded-full opacity-70">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br-sm" />
              </div>
              {/* Scan line */}
              <div className="absolute scan-line left-0 right-0 h-0.5 bg-blue-400/60 shadow-[0_0_8px_2px_rgba(96,165,250,0.5)]" />
            </div>
            {/* Label */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
              Position face in the oval
            </div>
          </>
        ) : (
          <img src={captured} alt="Captured" className="w-full" />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        {!captured ? (
          <button
            onClick={capture}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Camera size={18} />
            Capture Photo
          </button>
        ) : (
          <>
            <button
              onClick={retake}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-5 rounded-xl transition-all"
            >
              <RefreshCw size={16} />
              Retake
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Camera size={16} />
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