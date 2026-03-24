export default function StatCard({ title, value, subtitle, icon: Icon, color = "blue", trend }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "bg-blue-500", text: "text-blue-600" },
    green: { bg: "bg-green-50", icon: "bg-green-500", text: "text-green-600" },
    red: { bg: "bg-red-50", icon: "bg-red-500", text: "text-red-600" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-500", text: "text-amber-600" },
    purple: { bg: "bg-purple-50", icon: "bg-purple-500", text: "text-purple-600" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs font-medium mt-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs yesterday
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${c.bg} p-3 rounded-xl`}>
            <Icon size={22} className={c.text} />
          </div>
        )}
      </div>
    </div>
  );
}