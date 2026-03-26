import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "react-toastify";
import { FiCamera, FiClipboard, FiGrid, FiLogOut, FiShield, FiUser } from "react-icons/fi";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import MarkAttendancePage from "./pages/MarkAttendancePage";
import AttendanceReportPage from "./pages/AttendanceReportPage";
import RegisterFacePage from "./pages/RegisterFacePage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import RequestsPage from "./pages/RequestsPage";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === "admin" || user?.role === "student") {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
};

function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const studentNav = [
    { to: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { to: "/attendance", label: "Attendance", icon: <FiClipboard /> },
    { to: "/face", label: "Face ID", icon: <FiCamera /> },
    { to: "/profile", label: "Profile", icon: <FiUser /> },
  ];

  const adminNav = [
    { to: "/admin", label: "Dashboard", icon: <FiShield /> },
    { to: "/admin/requests", label: "Requests", icon: <FiClipboard /> },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <div className="container">
      <header className="topbar">
        <div>
          <p className="brand-kicker">Face Intelligence</p>
          <h1>Attendance System</h1>
        </div>
        {user && (
          <div className="topbar-actions">
            <span className="user-chip">
              {!isAdmin ? (
                user.profileImage ? <img src={user.profileImage} alt="avatar" className="chip-avatar" /> : <FiUser />
              ) : (
                <FiUser />
              )}
              {isAdmin ? "Admin" : user.fullName || user.regNumber}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        )}
      </header>

      {user && (
        <nav className="nav-tabs" aria-label="Primary Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-tab ${isActive ? "is-active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <main>{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <LandingPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="student">
            <Shell>
              <DashboardPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute role="student">
            <Shell>
              <MarkAttendancePage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/face"
        element={
          <ProtectedRoute role="student">
            <Shell>
              <RegisterFacePage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute role="student">
            <Shell>
              <ProfilePage />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Shell>
              <AdminDashboard />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute role="admin">
            <Shell>
              <RequestsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute role="admin">
            <Shell>
              <AttendanceReportPage />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="light"
            toastClassName="toast-white"
            bodyClassName="toast-white-body"
            progressClassName="toast-white-progress"
          />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}