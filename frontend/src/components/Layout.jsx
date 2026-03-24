import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Camera, Users, FileText, LogOut,
  Menu, X, ScanFace, ClipboardList, ChevronRight, Bell
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "employee"] },
  { to: "/mark-attendance", icon: Camera, label: "Mark Attendance", roles: ["admin", "employee"] },
  { to: "/my-attendance", icon: ClipboardList, label: "My Attendance", roles: ["admin", "employee"] },
  { to: "/register-face", icon: ScanFace, label: "Register Face", roles: ["admin", "employee"] },
  { to: "/admin-dashboard", icon: LayoutDashboard, label: "Admin Dashboard", roles: ["admin"] },
  { to: "/employees", icon: Users, label: "Employees", roles: ["admin"] },
  { to: "/reports", icon: FileText, label: "Reports", roles: ["admin"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filtered = navItems.filter((i) => i.roles.includes(user?.role));

  const renderSidebar = (mobile = false) => (
    <div className={`flex flex-col h-full bg-slate-900 text-white ${mobile ? "" : "w-64"}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
          <ScanFace size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none">FaceAttend</p>
          <p className="text-xs text-slate-400 mt-0.5">Attendance System</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`
            }
          >
            <item.icon size={18} />
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800 mb-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 flex-shrink-0 shadow-xl">
        {renderSidebar()}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 flex-shrink-0">
            {renderSidebar(true)}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-600 hover:text-slate-900"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-slate-800">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </button>
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}