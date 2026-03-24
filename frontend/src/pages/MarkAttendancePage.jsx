import { useEffect, useState } from "react";
import { FiCalendar, FiClock } from "react-icons/fi";
import API from "../api/axios";
import WebcamCapture from "../components/WebcamCapture";
import { useToast } from "../context/ToastContext";
import LoadingPulse from "../components/LoadingPulse";

export default function MarkAttendancePage() {
  const { showError, showSuccess } = useToast();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAttendance = async () => {
    setPageLoading(true);
    try {
      const { data } = await API.get("/attendance/me");
      setStudent(data.student || null);
      setAttendance(data.attendance || []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load attendance";
      setError(message);
      showError(message);
    } finally {
      setPageLoading(false);
    }
  };

  const getDailyStatus = () => {
    if (!student?.createdAt) return [];

    const toLocalDateString = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const presentMap = new Map((attendance || []).map((item) => [item.date, item]));
    const created = new Date(student.createdAt);
    const today = new Date();
    const day = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const rows = [];

    while (day <= end) {
      const key = toLocalDateString(day);
      const match = presentMap.get(key);
      rows.push({
        date: key,
        status: match ? "PRESENT" : "ABSENT",
        markedAt: match?.markedAt || null,
      });
      day.setDate(day.getDate() + 1);
    }

    return rows.reverse();
  };

  const dailyStatus = getDailyStatus();

  useEffect(() => {
    loadAttendance();
  }, []);

  const onMark = async (image) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await API.post("/attendance/mark", { image });
      setMessage(data.message);
      showSuccess(data.message || "Attendance marked successfully");
      await loadAttendance();
    } catch (err) {
      const messageText = err.response?.data?.message || "Failed to mark attendance";
      setError(messageText);
      showError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="section-header">
        <h2>Attendance</h2>
        <p className="muted">Attendance is marked only when your live face matches your registered face. One mark per day.</p>
      </div>

      {pageLoading ? <LoadingPulse label="Loading attendance..." /> : null}

      {!pageLoading ? <WebcamCapture onCapture={onMark} loading={loading} label="Verify Face & Mark Attendance" /> : null}

      {message && <p>{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div>
        <h3>Daily Status</h3>
        {dailyStatus.length === 0 ? <p className="muted">No attendance records yet.</p> : null}
        {dailyStatus.map((item) => (
          <div key={item.date} className="list-item">
            <strong><FiCalendar style={{ marginRight: 6, verticalAlign: "middle" }} />{item.date}</strong>
            <span>{item.status}</span>
            <small>
              {item.markedAt ? <><FiClock style={{ marginRight: 6, verticalAlign: "middle" }} />{new Date(item.markedAt).toLocaleString()}</> : "Not marked"}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}