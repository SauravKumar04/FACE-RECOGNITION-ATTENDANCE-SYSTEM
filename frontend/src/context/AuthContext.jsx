/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

const isValidRole = (role) => role === "student" || role === "admin";

const getInitialUser = () => {
  try {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    if (!token || !raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !isValidRole(parsed.role)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getInitialUser());
  const [loading, setLoading] = useState(false);

  const persistSession = (data) => {
    if (!data?.token || !data?.user || !isValidRole(data.user.role)) {
      throw new Error("Invalid session payload");
    }
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const loginStudent = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { email, password });
      persistSession(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/admin/login", { email, password });
      persistSession(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Admin login failed" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", formData);
      persistSession(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const syncStudentProfile = async () => {
      if (!user || user.role !== "student") return;
      try {
        const { data } = await API.get("/student/me");
        const student = data?.student;
        if (!student) return;

        updateUser({
          fullName: student.fullName || "",
          profileImage: student.profileImage || "",
          regNumber: student.regNumber,
        });
      } catch {
        // Ignore silent profile sync failure.
      }
    };

    syncStudentProfile();
  }, [user?.id, user?.role]);

  return (
    <AuthContext.Provider value={{ user, loading, loginStudent, loginAdmin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};