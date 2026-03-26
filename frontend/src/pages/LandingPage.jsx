import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";

export default function LandingPage() {
  return (
    <section className="landing-page">
      <div className="landing-grid">
        <div className="landing-copy">
          <p className="landing-kicker">Face Intelligence Platform</p>
          <h1>Attendance Management, Reimagined</h1>
          <p>
            A clean, secure, and premium attendance platform powered by face verification,
            role-based control, and real-time daily records.
          </p>

          <div className="landing-actions">
            <Link to="/login" className="btn">
              Login
              <FiArrowRight />
            </Link>
            <Link to="/register" className="btn btn-ghost">
              Register
            </Link>
          </div>

          <div className="landing-points">
            <div className="landing-point">
              <FiCamera />
              <span>ArcFace-based face verification</span>
            </div>
            <div className="landing-point">
              <FiCheckCircle />
              <span>Daily present and absent timeline</span>
            </div>
            <div className="landing-point">
              <FiShield />
              <span>Student and admin dashboards</span>
            </div>
          </div>

          <div className="landing-steps">
            <h3>How It Works</h3>
            <div className="landing-step-row">
              <span className="step-badge">01</span>
              <p>Students register account and capture 5 face samples.</p>
            </div>
            <div className="landing-step-row">
              <span className="step-badge">02</span>
              <p>System verifies identity in real-time before marking attendance.</p>
            </div>
            <div className="landing-step-row">
              <span className="step-badge">03</span>
              <p>Admins monitor records, requests, and detailed attendance reports.</p>
            </div>
          </div>
        </div>

        <div className="landing-panel">
          <div className="landing-panel-top">
            <span className="panel-dot" />
            <span className="panel-dot" />
            <span className="panel-dot" />
          </div>
          <div className="landing-metric-grid">
            <div className="landing-metric">
              <p>Face Match Accuracy</p>
              <h3>99.2%</h3>
            </div>
            <div className="landing-metric">
              <p>Attendance Marking</p>
              <h3>Real-Time</h3>
            </div>
            <div className="landing-metric">
              <p>Daily Tracking</p>
              <h3>Present/Absent</h3>
            </div>
            <div className="landing-metric">
              <p>Profile + Face Gallery</p>
              <h3>Integrated</h3>
            </div>
          </div>

          <div className="landing-role-grid">
            <div className="landing-role-card">
              <FiUserCheck />
              <h4>For Students</h4>
              <p>Face ID enrollment, daily status view, profile management, and history.</p>
            </div>
            <div className="landing-role-card">
              <FiLayers />
              <h4>For Admins</h4>
              <p>Department filtering, report views, request approvals, and audit visibility.</p>
            </div>
          </div>

          <div className="landing-trust">
            <div className="landing-trust-item">
              <FiClock />
              <span>Fast live verification</span>
            </div>
            <div className="landing-trust-item">
              <FiShield />
              <span>Role-protected routes</span>
            </div>
            <div className="landing-trust-item">
              <FiCheckCircle />
              <span>Clean daily records</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
