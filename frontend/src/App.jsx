import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MarkAttendancePage from "./pages/MarkAttendancePage";
import EmployeesPage from "./pages/EmployeesPage";
import AttendanceReportPage from "./pages/AttendanceReportPage";
import RegisterFacePage from "./pages/RegisterFacePage";
import MyAttendancePage from "./pages/MyAttendancePage";
import AdminDashboard from "./pages/AdminDashboard";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="admin-dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="mark-attendance" element={<MarkAttendancePage />} />
        <Route path="my-attendance" element={<MyAttendancePage />} />
        <Route path="register-face" element={<RegisterFacePage />} />
        <Route path="employees" element={<ProtectedRoute adminOnly><EmployeesPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute adminOnly><AttendanceReportPage /></ProtectedRoute>} />
      </Route>
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
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}