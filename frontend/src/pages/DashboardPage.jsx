import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiCamera, FiCheckCircle, FiClipboard, FiUser, FiXCircle } from "react-icons/fi";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import LoadingPulse from "../components/LoadingPulse";

export default function DashboardPage() {
  const { showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await API.get("/student/me");
      setData(res);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load dashboard";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <section className="card"><LoadingPulse label="Loading dashboard..." /></section>;

  return (
    <section className="card">
      <div className="section-header">
        <h2>Student Dashboard</h2>
      </div>
      {error && <p className="error-text">{error}</p>}

      {data ? (
        <>
          <div className="stats-grid">
            <div className="stat-box">
              <p className="muted">Total Present Days</p>
              <FiCheckCircle />
              <h3>{data.summary.presentDays}</h3>
            </div>
            <div className="stat-box">
              <p className="muted">Total Absent Days</p>
              <FiXCircle />
              <h3>{data.summary.absentDays}</h3>
            </div>
            <div className="stat-box">
              <p className="muted">Monthly Attendance</p>
              <FiClipboard />
              <h3>{data.summary.monthlySummary.presentDays}</h3>
              <small>{data.summary.monthlySummary.month}</small>
            </div>
          </div>

          <div className="row-actions">
            <Link className="btn" to="/attendance"><FiClipboard />Mark Attendance</Link>
            <Link className="btn btn-ghost" to="/face"><FiCamera />Face ID</Link>
            <Link className="btn btn-ghost" to="/profile"><FiUser />Profile</Link>
          </div>

          <p className="muted">
            Face registration status: {data.student.faceVerified ? "Completed" : "Pending (mandatory)"}
          </p>
        </>
      ) : null}
    </section>
  );
}