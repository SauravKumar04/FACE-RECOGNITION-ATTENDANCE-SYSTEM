import { useEffect, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import LoadingPulse from "../components/LoadingPulse";

export default function AttendanceReportPage() {
  const { showError } = useToast();
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get(`/admin/students/${studentId}/attendance`);
      setStudent(data.student);
      setAttendance(data.attendance || []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load student attendance";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [studentId]);

  return (
    <section className="card">
      <div className="section-header">
        <h2>Student Attendance Detail</h2>
      </div>
      {loading ? <LoadingPulse label="Loading attendance report..." /> : null}
      {error && <p className="error-text">{error}</p>}

      {student && (
        <div className="list-item">
          <div>
            <strong>{student.fullName || student.regNumber}</strong>
            <p className="muted">{student.roll} - {student.department}</p>
            <p className="muted">{student.email}</p>
            <p className="muted">Reg: {student.regNumber}</p>
          </div>
          {student.profileImage ? <img src={student.profileImage} alt="student-profile" className="mini-avatar" /> : null}
        </div>
      )}

      {student?.faceImages?.length > 0 ? (
        <div>
          <h3>Registered Face Images</h3>
          <div className="thumb-grid">
            {student.faceImages.slice(0, 5).map((img, idx) => (
              <img key={idx} src={img} alt={`student-face-${idx}`} />
            ))}
          </div>
        </div>
      ) : null}

      {attendance.map((a) => (
        <div key={`${a.date}-${a.markedAt}`} className="list-item">
          <strong><FiCalendar style={{ marginRight: 6, verticalAlign: "middle" }} />{a.date}</strong>
          <span>{a.status}</span>
          <small>{new Date(a.markedAt).toLocaleString()}</small>
        </div>
      ))}
    </section>
  );
}