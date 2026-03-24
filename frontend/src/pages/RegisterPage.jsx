import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ScanFace, Eye, EyeOff, Loader2 } from "lucide-react";

const DEPARTMENTS = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations", "Design", "Support"];
const BATCHES = ["2024-A", "2024-B", "2023-A", "2023-B", "2022-A"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    department: "",
    position: "",
    batch: "",
    semester: 1,
    role: "employee",
  });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.employeeId) {
      showError("Please fill in all required fields");
      return;
    }

    if (form.password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    const res = await register(form);
    if (res.success) {
      showSuccess("Account created successfully! 🎉");
      navigate("/dashboard");
    } else {
      showError(res.message || "Registration failed");
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
              <ScanFace size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 text-sm mt-1">Join FaceAttend</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={set("name")}
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Employee ID *</label>
                <input
                  required
                  value={form.employeeId}
                  onChange={set("employeeId")}
                  placeholder="EMP001"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="you@company.com"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Department *</label>
                <select
                  required
                  value={form.department}
                  onChange={set("department")}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select...</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Position *</label>
                <input
                  required
                  value={form.position}
                  onChange={set("position")}
                  placeholder="Developer"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Batch</label>
                <select
                  value={form.batch}
                  onChange={set("batch")}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select Batch</option>
                  {BATCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Semester</label>
                <select
                  value={form.semester}
                  onChange={set("semester")}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={set("role")}
                className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 6 characters"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}