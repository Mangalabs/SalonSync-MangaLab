import {
  Home,
  CalendarCheck,
  Users,
  ClipboardList,
  User,
  Warehouse,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SchedulingPanel } from "@/components/custom/SchedulingPanel";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/dashboard/appointments", icon: CalendarCheck, label: "Atendimentos" },
  { to: "/dashboard/professionals", icon: Users, label: "Profissionais" },
  { to: "/dashboard/services", icon: ClipboardList, label: "Serviços" },
  { to: "/dashboard/clients", icon: User, label: "Clientes" },
  { to: "/dashboard/inventory", icon: Warehouse, label: "Estoque" },
  { to: "/dashboard/reports", icon: BarChart2, label: "Relatórios" },
  { to: "/dashboard/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-[#FF5D73] text-white flex flex-col px-4 py-6 fixed left-0 top-0">
      <h2 className="text-xl font-bold mb-6">Painel</h2>

      <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
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
      </div>

      <div className="mt-6">
        <NavLink to="/dashboard/appointments?new=true">
          <Button className="w-full bg-white text-[#FF5D73] border border-white hover:bg-gray-100">
            Novo Atendimento
          </Button>
        </NavLink>
        <div className="mt-6">
          <SchedulingPanel />
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="mt-6 flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 justify-start"
      >
        <LogOut size={18} />
        Sair
      </Button>
    </aside>
  );
}
