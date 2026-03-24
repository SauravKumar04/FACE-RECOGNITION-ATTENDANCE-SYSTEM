import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import {
  Users, Plus, Search, ScanFace, Trash2, CheckCircle2, XCircle,
  Loader2, Building2, X
} from "lucide-react";

const DEPARTMENTS = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations", "Design", "Support"];

function AddEmployeeModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", email: "", employeeId: "", department: "", position: "", password: "password123" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await API.post("/employees", form);
      onAdded(data.employee);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Add New Employee</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {[
            { key: "name", label: "Full Name", placeholder: "John Doe" },
            { key: "employeeId", label: "Employee ID", placeholder: "EMP001" },
            { key: "email", label: "Email", placeholder: "john@company.com", type: "email" },
            { key: "position", label: "Position", placeholder: "Developer" },
          ].map(({ key, label, placeholder, type = "text" }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
              <input type={type} required value={form[key]} onChange={set(key)} placeholder={placeholder}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department</label>
            <select required value={form.department} onChange={set("department")}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select department...</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await API.get("/employees", { params: { search, limit: 50 } });
      setEmployees(data.employees);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const setAction = (id, val) => setActionLoading((prev) => ({ ...prev, [id]: val }));

  const handleDeleteFace = async (emp) => {
    if (!confirm(`Delete face data for ${emp.name}?`)) return;
    setAction(emp._id, "face");
    try {
      await API.delete(`/employees/${emp._id}/face`);
      setEmployees((prev) => prev.map((e) => e._id === emp._id ? { ...e, faceRegistered: false, faceSamples: 0 } : e));
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setAction(emp._id, null);
    }
  };

  const handleDeactivate = async (emp) => {
    if (!confirm(`Deactivate ${emp.name}?`)) return;
    setAction(emp._id, "delete");
    try {
      await API.delete(`/employees/${emp._id}`);
      setEmployees((prev) => prev.filter((e) => e._id !== emp._id));
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setAction(emp._id, null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Employees</h2>
          <p className="text-slate-500 text-sm mt-0.5">{employees.length} active employees</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all">
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID or email..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={40} className="mb-2 opacity-40" />
            <p className="text-sm">No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Employee", "Department", "Position", "Face Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{emp.name}</p>
                          <p className="text-xs text-slate-400">{emp.employeeId} • {emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Building2 size={13} className="text-slate-400" /> {emp.department}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{emp.position}</td>
                    <td className="px-5 py-4">
                      {emp.faceRegistered ? (
                        <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-semibold w-fit">
                          <CheckCircle2 size={12} /> Registered ({emp.faceSamples} samples)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-semibold w-fit">
                          <XCircle size={12} /> Not registered
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {emp.faceRegistered && (
                          <button onClick={() => handleDeleteFace(emp)} disabled={!!actionLoading[emp._id]}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Delete face data">
                            {actionLoading[emp._id] === "face" ? <Loader2 size={14} className="animate-spin" /> : <ScanFace size={14} />}
                          </button>
                        )}
                        <button onClick={() => handleDeactivate(emp)} disabled={!!actionLoading[emp._id]}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Deactivate employee">
                          {actionLoading[emp._id] === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AddEmployeeModal onClose={() => setShowModal(false)} onAdded={(emp) => setEmployees((prev) => [emp, ...prev])} />}
    </div>
  );
}