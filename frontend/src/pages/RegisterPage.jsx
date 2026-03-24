import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEdit3, FiUserPlus } from "react-icons/fi";
import { ImSpinner8 } from "react-icons/im";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const DEPARTMENTS = ["CSE", "ECE", "EE", "MECH", "CIVIL", "CHEM", "OTHER"];

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    regNumber: "",
    roll: "",
    department: "",
    email: "",
    password: "",
  });

  const onChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await register(form);
    if (!result.success) {
      setError(result.message);
      showError(result.message);
      return;
    }
    showSuccess("Registration successful");
    navigate("/dashboard");
  };

  return (
    <div className="auth-wrap">
      <form className="card" onSubmit={onSubmit}>
        <h2>Student Registration</h2>
        <p className="muted">Create a clean profile before registering your face.</p>

        <label>Registration Number</label>
        <input value={form.regNumber} onChange={onChange("regNumber")} required />

        <label>Roll Number</label>
        <input value={form.roll} onChange={onChange("roll")} required />

        <label>Department</label>
        <select value={form.department} onChange={onChange("department")} required>
          <option value="">Select department</option>
          {DEPARTMENTS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <label>Email</label>
        <input type="email" value={form.email} onChange={onChange("email")} required />

        <label>Password</label>
        <input type="password" value={form.password} onChange={onChange("password")} required />

        {error && <p className="error-text">{error}</p>}

        <button className="btn" type="submit" disabled={loading}>
          <FiUserPlus size={16} />
          {loading ? <><ImSpinner8 className="spin" />Please wait...</> : "Register"}
        </button>

        <p className="muted">
          <FiEdit3 style={{ verticalAlign: "middle", marginRight: 6 }} />
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}