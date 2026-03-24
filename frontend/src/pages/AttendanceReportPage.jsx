import { useState, useEffect } from "react";
import API from "../api/axios";
import { FileText, Download, Search, Loader2, Filter } from "lucide-react";

const formatTime = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";
const statusColors = {
  present: "bg-green-100 text-green-700",
  late: "bg-amber-100 text-amber-700",
  absent: "bg-red-100 text-red-700",
  "half-day": "bg-purple-100 text-purple-700",
};

export default function AttendanceReportPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    employeeId: "",
    startDate: "",
    endDate: "",
  });
  const [useRange, setUseRange] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = useRange
        ? { startDate: filters.startDate, endDate: filters.endDate, employeeId: filters.employeeId }
        : { date: filters.date, employeeId: filters.employeeId };
      const { data } = await API.get("/attendance", { params: { ...params, limit: 100 } });
      setRecords(data.records);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const exportCSV = () => {
    const headers = ["Employee", "ID", "Department", "Date", "Check In", "Check Out", "Hours", "Status"];
    const rows = records.map((r) => [
      r.employee?.name, r.employeeId, r.employee?.department,
      r.date, formatTime(r.checkIn), formatTime(r.checkOut),
      r.workingHours || 0, r.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${filters.date || "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance Reports</h2>
          <p className="text-slate-500 text-sm mt-0.5">{total} records found</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all">
          <Download size={17} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-slate-500" />
          <span className="font-semibold text-slate-700 text-sm">Filters</span>
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={useRange} onChange={(e) => setUseRange(e.target.checked)} className="rounded" />
            Date range
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {!useRange ? (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input type="date" value={filters.date} onChange={set("date")}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                <input type="date" value={filters.startDate} onChange={set("startDate")}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                <input type="date" value={filters.endDate} onChange={set("endDate")}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Employee ID</label>
            <input value={filters.employeeId} onChange={set("employeeId")} placeholder="e.g. EMP001"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchRecords}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
              <Search size={15} /> Search
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText size={40} className="mb-2 opacity-40" />
            <p className="text-sm">No records found for selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Employee", "Date", "Check In", "Check Out", "Working Hrs", "Confidence", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {r.employee?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{r.employee?.name}</p>
                          <p className="text-xs text-slate-400">{r.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{r.date}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{formatTime(r.checkIn)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{formatTime(r.checkOut)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{r.workingHours ? `${r.workingHours}h` : "—"}</td>
                    <td className="px-5 py-3.5">
                      {r.confidence ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          r.confidence > 85 ? "bg-green-100 text-green-700" :
                          r.confidence > 70 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>{r.confidence}%</span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[r.status] || "bg-slate-100 text-slate-600"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}