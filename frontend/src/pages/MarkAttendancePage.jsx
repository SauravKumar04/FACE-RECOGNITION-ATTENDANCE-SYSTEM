import { useState } from "react";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import WebcamCapture from "../components/WebcamCapture";
import { CheckCircle2, XCircle, Clock, UserCheck, Building2, Briefcase, AlertTriangle } from "lucide-react";

export default function MarkAttendancePage() {
  const { showSuccess, showError, showInfo } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCapture = async (image) => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await API.post("/attendance/mark", { image });
      setResult(data);
      
      if (data.action === "check-in") {
        showSuccess(`✅ ${data.employee?.name} checked in successfully!`);
      } else if (data.action === "check-out") {
        showSuccess(`👋 ${data.employee?.name} checked out successfully!`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to mark attendance";
      showError(msg);
      // Show the error as a result card for better visibility
      setResult({
        action: "error",
        message: msg,
        isSecurityIssue: err.response?.status === 403,
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action === "check-in") return "green";
    if (action === "check-out") return "blue";
    return "slate";
  };

  const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Mark Attendance</h2>
        <p className="text-slate-500 text-sm mt-1">Look at the camera to check in or check out</p>
      </div>

      {/* Camera */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <WebcamCapture onCapture={handleCapture} loading={loading} label="Mark Attendance" />
      </div>

      {/* Success Result */}
      {result && (
        <div className={`rounded-2xl border p-6 ${
          result.action === "check-in" ? "bg-green-50 border-green-200" :
          result.action === "check-out" ? "bg-blue-50 border-blue-200" :
          result.isSecurityIssue ? "bg-amber-50 border-amber-300" :
          result.action === "error" ? "bg-red-50 border-red-200" :
          "bg-slate-50 border-slate-200"
        }`}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            {result.action === "check-in" ? (
              <CheckCircle2 size={28} className="text-green-600 flex-shrink-0" />
            ) : result.action === "check-out" ? (
              <CheckCircle2 size={28} className="text-blue-600 flex-shrink-0" />
            ) : result.isSecurityIssue ? (
              <AlertTriangle size={28} className="text-amber-600 flex-shrink-0" />
            ) : result.action === "error" ? (
              <XCircle size={28} className="text-red-600 flex-shrink-0" />
            ) : (
              <AlertTriangle size={28} className="text-amber-500 flex-shrink-0" />
            )}
            <div>
              <p className={`font-bold text-lg ${
                result.action === "check-in" ? "text-green-800" :
                result.action === "check-out" ? "text-blue-800" :
                result.isSecurityIssue ? "text-amber-800" :
                result.action === "error" ? "text-red-800" :
                "text-slate-700"
              }`}>
                {result.action === "check-in" ? "Checked In!" :
                 result.action === "check-out" ? "Checked Out!" : 
                 result.isSecurityIssue ? "⚠️ Security Notice" :
                 result.action === "error" ? "Recognition Failed" : "Already Marked"}
              </p>
              <p className={`text-sm ${
                result.isSecurityIssue ? "text-amber-700" : "text-slate-600"
              }`}>{result.message}</p>
            </div>
          </div>{" "}

          {/* Employee Info - Only show if success */}
          {result.action !== "error" && (
          <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {result.employee?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800">{result.employee?.name}</p>
                <p className="text-xs text-slate-500">{result.employee?.employeeId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 size={14} className="text-slate-400" />
                <span>{result.employee?.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Briefcase size={14} className="text-slate-400" />
                <span>{result.employee?.position}</span>
              </div>
              {result.attendance?.checkIn && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={14} className="text-green-500" />
                  <span>In: {formatTime(result.attendance.checkIn)}</span>
                </div>
              )}
              {result.attendance?.checkOut && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={14} className="text-blue-500" />
                  <span>Out: {formatTime(result.attendance.checkOut)}</span>
                </div>
              )}
              {result.attendance?.workingHours > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
                  <UserCheck size={14} className="text-purple-500" />
                  <span>Total: {result.attendance.workingHours} hrs worked</span>
                </div>
              )}
            </div>

            {/* Confidence badge */}
            {result.attendance?.confidence && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Recognition confidence</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  result.attendance.confidence > 85 ? "bg-green-100 text-green-700" :
                  result.attendance.confidence > 70 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {result.attendance.confidence}%
                </span>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!result && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <p className="font-semibold text-slate-700 text-sm mb-3">Tips for accurate recognition</p>
          <ul className="space-y-2 text-sm text-slate-600">
            {[
              "🔒 Only your registered face can mark YOUR attendance",
              "💡 Face must be clearly visible - ensure good lighting (no shadows on face)",
              "👁️ Look directly at camera and keep face centered in oval frame",
              "📏 Face should be at natural distance (~30-45cm from camera)",
              "🥽 Remove glasses/masks if possible - match your registered photos",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}