import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiFilter, FiTrash2 } from "react-icons/fi";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import LoadingPulse from "../components/LoadingPulse";

export default function AdminDashboard() {
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [department, setDepartment] = useState("");
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const params = department ? { department } : {};
      const { data } = await API.get("/admin/students", { params });
      setStudents(data.students || []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load students";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [department]);

  const removeStudent = async (studentId) => {
    try {
      await API.delete(`/admin/students/${studentId}`);
      showSuccess("Student removed successfully");
      await loadStudents();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to remove student";
      setError(message);
      showError(message);
    }
  };

  return (
    <section className="card">
      <div className="row-actions section-header">
        <h2>Admin Dashboard</h2>
        <Link className="btn" to="/admin/requests">Requests</Link>
      </div>

      <label>Filter by Department</label>
      <input
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        placeholder="Type department"
      />
      <p className="muted"><FiFilter style={{ verticalAlign: "middle", marginRight: 6 }} />Use a department keyword to narrow the list.</p>

      {error && <p className="error-text">{error}</p>}
      {loading ? <LoadingPulse label="Loading students..." /> : null}

      {students.map((student) => (
        <div key={student._id} className="list-item">
          <div>
            <strong>{student.fullName || student.regNumber}</strong>
            <p className="muted">{student.roll} - {student.department}</p>
            <p className="muted">{student.email}</p>
            <p className="muted">Reg: {student.regNumber}</p>
          </div>
          {student.profileImage ? <img src={student.profileImage} alt="profile" className="mini-avatar" /> : null}
          <div className="row-actions">
            <button className="btn" onClick={() => navigate(`/admin/students/${student._id}`)}><FiEye />View</button>
            <button className="btn btn-danger" onClick={() => removeStudent(student._id)}><FiTrash2 />Remove</button>
          </div>
        </div>
      ))}
    </section>
  );
}
