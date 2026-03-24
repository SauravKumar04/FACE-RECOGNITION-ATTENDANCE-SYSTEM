import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import API from "../api/axios";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  BarChart3,
  Search,
  Download,
  Filter,
  Eye,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [classAttendance, setClassAttendance] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, batchRes, monthlyRes] = await Promise.all([
        API.get("/admin/dashboard-stats"),
        API.get("/admin/batch-summary"),
        API.get("/admin/monthly-stats"),
      ]);

      setStats(statsRes.data.stats);
      setBatches(batchRes.data.batches);
      setMonthlyStats(monthlyRes.data.stats);

      if (batchRes.data.batches.length > 0) {
        setSelectedBatch(batchRes.data.batches[0]._id);
      }

      showSuccess("Dashboard data loaded successfully");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassAttendance = async (batch = selectedBatch) => {
    if (!batch) return;
    try {
      const res = await API.get("/admin/class-attendance", {
        params: { batch, date: selectedDate },
      });
      setClassAttendance(res.data);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load class attendance");
    }
  };

  useEffect(() => {
    if (selectedBatch && activeTab === "attendance") {
      fetchClassAttendance();
    }
  }, [selectedBatch, selectedDate, activeTab]);

  const handleExportCSV = () => {
    if (!classAttendance) return;

    const headers = ["Employee ID", "Name", "Department", "Status", "Check In", "Check Out"];
    const rows = classAttendance.detailedReport.map((emp) => [
      emp.employeeId,
      emp.name,
      emp.department,
      emp.status,
      emp.checkIn ? new Date(emp.checkIn).toLocaleString() : "—",
      emp.checkOut ? new Date(emp.checkOut).toLocaleString() : "—",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    a.click();
    showSuccess("CSV exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">
            Welcome, {user?.name}. Manage student attendance and view statistics.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Last Updated</p>
          <p className="font-semibold text-slate-700">
            {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {["overview", "attendance", "analytics"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-all ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "overview" && "📊 Overview"}
            {tab === "attendance" && "✓ Attendance"}
            {tab === "analytics" && "📈 Analytics"}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Total Students</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats.totalEmployees}
                  </p>
                </div>
                <Users size={24} className="text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Face Registered</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats.faceRegistered}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.faceRegistrationRate}%
                  </p>
                </div>
                <Eye size={24} className="text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Present Today</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats.todayPresentCount}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.todayAttendanceRate}% attendance
                  </p>
                </div>
                <UserCheck size={24} className="text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Absent Today</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats.todayAbsentCount}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {Math.round(
                      (stats.todayAbsentCount / stats.totalEmployees) * 100
                    )}% of total
                  </p>
                </div>
                <UserX size={24} className="text-red-500" />
              </div>
            </div>
          </div>

          {/* Batch Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" />
              Batch Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Batch
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Total Students
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Active
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Face Registered
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Today Attendance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr
                      key={batch._id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {batch._id}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {batch.totalStudents}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {batch.activeStudents}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {batch.faceRegistered}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {batch.attendanceToday}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Batch
                </label>
                <select
                  value={selectedBatch || ""}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch._id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex-1">
                <button
                  onClick={handleExportCSV}
                  disabled={!classAttendance}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Class Attendance Summary */}
          {classAttendance && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
                  <p className="text-slate-600 text-xs font-medium mb-1">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {classAttendance.summary.totalStudents}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4 shadow-sm text-center">
                  <p className="text-green-700 text-xs font-medium mb-1">
                    Present
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {classAttendance.summary.present}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm text-center">
                  <p className="text-amber-700 text-xs font-medium mb-1">Late</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {classAttendance.summary.late}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm text-center">
                  <p className="text-red-700 text-xs font-medium mb-1">Absent</p>
                  <p className="text-2xl font-bold text-red-700">
                    {classAttendance.summary.absent}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 shadow-sm text-center">
                  <p className="text-blue-700 text-xs font-medium mb-1">
                    Attendance Rate
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {classAttendance.summary.attendanceRate}%
                  </p>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
                <h3 className="font-bold text-slate-900 mb-4">
                  Detailed Attendance Report
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Department
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Check In
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Check Out
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classAttendance.detailedReport.map((emp) => (
                      <tr
                        key={emp._id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {emp.employeeId}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{emp.name}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {emp.department}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              emp.status === "present"
                                ? "bg-green-100 text-green-800"
                                : emp.status === "late"
                                ? "bg-amber-100 text-amber-800"
                                : emp.status === "half-day"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {emp.status.charAt(0).toUpperCase() +
                              emp.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-xs">
                          {emp.checkIn
                            ? new Date(emp.checkIn).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-xs">
                          {emp.checkOut
                            ? new Date(emp.checkOut).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Monthly Attendance Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="late" fill="#f59e0b" name="Late" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
