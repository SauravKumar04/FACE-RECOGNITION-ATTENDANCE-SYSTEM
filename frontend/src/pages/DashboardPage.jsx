import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import StatCard from "../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ClipboardList, CheckCircle2, AlertTriangle, Percent, Calendar, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const formatDate = (s) => {
  const d = new Date(s);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        
        // Get student's attendance stats
        const statsRes = await API.get(`/attendance/student-stats/${user.employeeId}`);
        setStats(statsRes.data);

        // Get today's status for this student
        const todayRes = await API.get(`/attendance/student-today/${user.employeeId}`);
        setTodayStatus(todayRes.data);

        // Get monthly data for this student
        const monthlyRes = await API.get(`/attendance/student-monthly/${user.employeeId}`);
        setMonthlyData(monthlyRes.data.records);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.employeeId) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Welcome back! Here's your attendance overview.
        </p>
      </div>

      {/* Face Registration Alert */}
      {!user?.faceRegistered && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">Face Registration Required</h3>
            <p className="text-sm text-amber-800 mb-3">
              You haven't registered your face yet. Register now to start marking attendance via face recognition.
            </p>
            <button
              onClick={() => navigate("/register-face")}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Register Face Now
            </button>
          </div>
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Attendance Percentage</p>
              <p className="text-4xl font-bold text-slate-900 mt-2">
                {stats?.attendancePercentage || 0}%
              </p>
            </div>
            <Percent size={28} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Present</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{stats?.present || 0}</p>
              <p className="text-xs text-slate-500 mt-1">days</p>
            </div>
            <CheckCircle2 size={28} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Late Arrivals</p>
              <p className="text-4xl font-bold text-amber-600 mt-2">{stats?.late || 0}</p>
              <p className="text-xs text-slate-500 mt-1">times</p>
            </div>
            <AlertTriangle size={28} className="text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Absent Days</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{stats?.absent || 0}</p>
              <p className="text-xs text-slate-500 mt-1">days</p>
            </div>
            <AlertCircle size={28} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Today's Status */}
      {todayStatus && (
        <div className={`rounded-2xl border p-6 ${
          todayStatus.marked
            ? "bg-green-50 border-green-200"
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-start gap-4">
            {todayStatus.marked ? (
              <CheckCircle2 size={28} className="text-green-600 flex-shrink-0" />
            ) : (
              <Calendar size={28} className="text-blue-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${
                todayStatus.marked ? "text-green-800" : "text-blue-800"
              }`}>
                {todayStatus.marked ? "✅ Already Marked Today" : "📅 Not Marked Yet"}
              </h3>
              {todayStatus.marked ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-green-700"><strong>Status:</strong> {todayStatus.status.charAt(0).toUpperCase() + todayStatus.status.slice(1)}</p>
                  {todayStatus.checkIn && (
                    <p className="text-green-700">
                      <strong>Marked at:</strong> {new Date(todayStatus.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-blue-700 text-sm mt-1">
                  Mark your attendance using face recognition.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Attendance Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Monthly Attendance Pattern
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Bar
                dataKey="isPresent"
                fill="#10b981"
                name="Present"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Records */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Recent Attendance</h3>
        {stats?.recentRecords && stats.recentRecords.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentRecords.slice(0, 5).map((record) => (
              <div key={record._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-800">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(record.date).toLocaleDateString("en-US", { year: "numeric" })}
                  </p>
                </div>
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                    record.status === "present"
                      ? "bg-green-100 text-green-700"
                      : record.status === "late"
                      ? "bg-amber-100 text-amber-700"
                      : record.status === "absent"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No attendance records yet</p>
          </div>
        )}
      </div>
    </div>
  );
}