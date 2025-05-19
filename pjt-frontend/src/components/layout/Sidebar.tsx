import {
  Home,
  CalendarCheck,
  Users,
  ClipboardList,
  Warehouse,
  BarChart2,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/dashboard/appointments", icon: CalendarCheck, label: "Agendamentos" },
  { to: "/dashboard/professionals", icon: Users, label: "Profissionais" },
  { to: "/dashboard/services", icon: ClipboardList, label: "Serviços" },
  { to: "/dashboard/inventory", icon: Warehouse, label: "Estoque" },
  { to: "/dashboard/reports", icon: BarChart2, label: "Relatórios" },
  { to: "/dashboard/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#FF5D73] text-white px-4 py-6 space-y-6">
      <h2 className="text-xl font-bold">Painel</h2>
      <nav className="flex flex-col space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition hover:bg-white/10 ${
                isActive ? "bg-white/20 font-semibold" : ""
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
