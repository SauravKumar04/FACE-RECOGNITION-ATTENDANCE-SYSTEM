import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogIn, FiShield, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function LoginPage() {
  const { loginStudent, loginAdmin, loading } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const action = mode === "admin" ? loginAdmin : loginStudent;
    const result = await action(email, password);
    if (!result.success) {
      setError(result.message);
      showError(result.message);
      return;
    }

    showSuccess(`Welcome back${mode === "admin" ? " Admin" : ""}`);
    navigate(mode === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="auth-wrap">
      <form className="card" onSubmit={onSubmit}>
        <h2>Login</h2>
        <p className="muted">Secure sign in for attendance operations.</p>

        <label>Login As</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="error-text">{error}</p>}

        <button className="btn" type="submit" disabled={loading}>
          {mode === "admin" ? <FiShield size={16} /> : <FiUser size={16} />}
          {loading ? "Please wait..." : "Login"}
        </button>

        <p className="muted">
          <FiLogIn style={{ verticalAlign: "middle", marginRight: 6 }} />
          New student? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
