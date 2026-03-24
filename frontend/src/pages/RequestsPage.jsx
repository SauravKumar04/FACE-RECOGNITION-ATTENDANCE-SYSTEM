import { useEffect, useState } from "react";
import { FiCheck, FiSlash } from "react-icons/fi";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import LoadingPulse from "../components/LoadingPulse";

export default function RequestsPage() {
  const { showError, showSuccess } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/requests");
      setRequests(data.requests || []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load requests";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId, action) => {
    try {
      await API.patch(`/requests/${requestId}/${action}`);
      showSuccess(action === "approve" ? "Request approved successfully" : "Request rejected successfully");
      await loadRequests();
    } catch (err) {
      const message = err.response?.data?.message || "Action failed";
      setError(message);
      showError(message);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <section className="card">
      <div className="section-header">
        <h2>Face ID Change Requests</h2>
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading ? <LoadingPulse label="Loading requests..." /> : null}
      {!loading && requests.length === 0 ? <p className="muted">No requests found.</p> : null}

      {requests.map((r) => (
        <div key={r._id} className="list-item">
          <div>
            <strong>{r.studentId?.regNumber}</strong>
            <p className="muted">{r.studentId?.email} - {r.studentId?.department}</p>
            <p className="muted">Status: {r.status}</p>
          </div>
          {r.status === "PENDING" ? (
            <div className="row-actions">
              <button className="btn" onClick={() => updateStatus(r._id, "approve")}><FiCheck />Approve</button>
              <button className="btn btn-danger" onClick={() => updateStatus(r._id, "reject")}><FiSlash />Reject</button>
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
