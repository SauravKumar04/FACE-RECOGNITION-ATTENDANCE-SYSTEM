import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import API from "../api/axios";
import WebcamCapture from "../components/WebcamCapture";
import { CheckCircle2, Info, ScanFace, Image as ImageIcon, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function RegisterFacePage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [faceData, setFaceData] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationForm, setVerificationForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [results, setResults] = useState([]);

  const samplesCount = results.length || (faceData?.faceSamples || 0);
  const RECOMMENDED_SAMPLES = 5;

  useEffect(() => {
    fetchFaceData();
  }, []);

  const fetchFaceData = async () => {
    try {
      const res = await API.get(`/employees/${user._id}/face-data`);
      setFaceData(res.data);
    } catch (err) {
      console.error("Error fetching face data:", err);
    }
  };

  const handleCapture = async (image) => {
    setLoading(true);
    try {
      const { data } = await API.post(`/employees/${user._id}/register-face`, { image });
      setResults((prev) => [
        { id: Date.now(), samples: data.faceSamples, message: data.message },
        ...prev.slice(0, 4),
      ]);
      setFaceData(data);
      showSuccess(`✅ ${data.message}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to register face";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();

    if (verificationForm.email !== user.email) {
      showError("Email does not match your account");
      return;
    }

    try {
      setLoading(true);
      // Verify password
      const res = await API.post("/auth/verify-password", {
        email: verificationForm.email,
        password: verificationForm.password,
      });

      if (res.data.success) {
        showSuccess("Verification successful! You can now update your face images.");
        setShowVerification(false);
        setResults([]); // Reset to allow new captures
      }
    } catch (err) {
      showError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const canUpdateFace = faceData?.faceSamples >= RECOMMENDED_SAMPLES;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Register Your Face</h2>
        <p className="text-slate-500 text-sm mt-1">
          Capture multiple angles for better recognition accuracy
        </p>
      </div>

      {/* First Time Registration Notice */}
      {!faceData?.faceRegistered && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">First Time Registration</h3>
            <p className="text-sm text-blue-800">
              Please register your face with at least 5 different angles. This helps improve recognition accuracy.
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Registration Progress</span>
          <span className="text-sm text-slate-500">
            {samplesCount}/{RECOMMENDED_SAMPLES} samples
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (samplesCount / RECOMMENDED_SAMPLES) * 100)}%` }}
          />
        </div>
        {samplesCount >= RECOMMENDED_SAMPLES && (
          <div className="flex items-center gap-2 mt-3 text-green-700 bg-green-50 rounded-xl px-3 py-2">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <p className="text-sm font-medium">Face registered successfully! ✨</p>
          </div>
        )}
      </div>

      {/* Verification Modal for Updates */}
      {canUpdateFace && !showVerification && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Lock size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">Update Face Images</h3>
              <p className="text-sm text-amber-800 mb-3">
                To update or re-register your face images, please verify your account first.
              </p>
              <button
                onClick={() => setShowVerification(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Verify & Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Form */}
      {showVerification && canUpdateFace && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Lock size={20} className="text-blue-600" />
            Verify Your Identity
          </h3>
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={verificationForm.email}
                onChange={(e) =>
                  setVerificationForm({ ...verificationForm, email: e.target.value })
                }
                placeholder={user.email}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {verificationForm.email && verificationForm.email !== user.email && (
                <p className="text-sm text-red-600 mt-1">Email does not match</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={verificationForm.password}
                  onChange={(e) =>
                    setVerificationForm({
                      ...verificationForm,
                      password: e.target.value,
                    })
                  }
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !verificationForm.email || !verificationForm.password}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Camera - Only show if not yet verified for update OR first time registration */}
      {!canUpdateFace || showVerification ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <WebcamCapture
            onCapture={handleCapture}
            loading={loading}
            label="Register This Photo"
          />
        </div>
      ) : null}

      {/* Registered Face Images Gallery */}
      {faceData?.faceRegistered && faceData.faceImages && faceData.faceImages.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ImageIcon size={20} className="text-blue-600" />
            Registered Face Images ({faceData.faceImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {faceData.faceImages.map((image, index) => (
              <div
                key={index}
                className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square"
              >
                <img
                  src={`data:image/jpeg;base64,${image}`}
                  alt={`Face Sample ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Sample {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capture log */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="font-semibold text-slate-700 text-sm mb-3">Capture Log</p>
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                <span className="text-slate-700">{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800 text-sm mb-2">
              Tips for best results
            </p>
            <ul className="text-sm text-blue-700 space-y-1.5">
              {[
                "Capture at least 5 different angles",
                "Try straight, left, right, up, and down",
                "Ensure bright, even lighting — avoid shadows",
                "Remove glasses if possible for one set",
                "Look directly at the camera lens",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="font-bold mt-0.5">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
