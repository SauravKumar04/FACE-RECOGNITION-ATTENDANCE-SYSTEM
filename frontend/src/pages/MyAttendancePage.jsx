import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 7));

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: res } = await API.get(`/attendance/employee/${user.employeeId}`, { params: { month } });
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.employeeId) fetch();
  }, [user, month]);

  const statusColors = {
    present: "bg-green-100 text-green-700",
    late: "bg-amber-100 text-amber-700",
    "half-day": "bg-purple-100 text-purple-700",
    absent: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Attendance</h2>
        <p className="text-slate-500 text-sm mt-0.5">Your personal attendance history</p>
      </div>

      {/* Month filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Month:</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          max={new Date().toISOString().substring(0, 7)}
          className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {data?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Days", value: data.summary.totalDays, icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
                { label: "Present", value: data.summary.present, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
                { label: "Late", value: data.summary.late, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
                { label: "Total Hours", value: `${data.summary.totalWorkingHours}h`, icon: Clock, color: "text-purple-600 bg-purple-50" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className={`w-9 h-9 rounded-xl mb-3 ${color}`} />
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Records */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Attendance Records</h3>
            </div>
            {!data?.records?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <ClipboardList size={36} className="mb-2 opacity-40" />
                <p className="text-sm">No records found for this month</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.records.map((r) => (
                  <div key={r._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-slate-600">
                          {new Date(r.date).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {new Date(r.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1"><Clock size={11} className="text-green-500" /> In: {formatTime(r.checkIn)}</span>
                          {r.checkOut && <span className="flex items-center gap-1"><Clock size={11} className="text-blue-500" /> Out: {formatTime(r.checkOut)}</span>}
                          {r.workingHours > 0 && <span>{r.workingHours}h worked</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.confidence > 0 && (
                        <span className="text-xs text-slate-400">{r.confidence}%</span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[r.status] || "bg-slate-100 text-slate-600"}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}