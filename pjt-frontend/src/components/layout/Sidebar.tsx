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
  Building2,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AppointmentForm } from "@/components/custom/AppointmentForm";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/dashboard/scheduling", icon: CalendarCheck, label: "Agendamentos" },
  { to: "/dashboard/professionals", icon: Users, label: "Profissionais" },
  { to: "/dashboard/services", icon: ClipboardList, label: "Serviços" },
  { to: "/dashboard/clients", icon: User, label: "Clientes" },
  { to: "/dashboard/inventory", icon: Warehouse, label: "Estoque" },
  { to: "/dashboard/reports", icon: BarChart2, label: "Relatórios" },
  { to: "/dashboard/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const [showScheduledForm, setShowScheduledForm] = useState(false);
  const [showImmediateForm, setShowImmediateForm] = useState(false);
  const { activeBranch, branches, setActiveBranch } = useBranch();

  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await axios.get("/api/auth/profile");
      return res.data;
    },
  });

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

      <div className="mt-6 space-y-3">
        <Button 
          onClick={() => setShowScheduledForm(true)}
          className="w-full bg-white text-[#FF5D73] border border-white hover:bg-gray-100"
        >
          Novo Agendamento
        </Button>
        <Button 
          onClick={() => setShowImmediateForm(true)}
          className="w-full bg-[#10b981] text-white hover:bg-[#059669]"
        >
          Novo Atendimento
        </Button>

      </div>

      <Dialog open={showScheduledForm} onOpenChange={setShowScheduledForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <AppointmentForm mode="scheduled" onSuccess={() => setShowScheduledForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showImmediateForm} onOpenChange={setShowImmediateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Atendimento</DialogTitle>
          </DialogHeader>
          <AppointmentForm mode="immediate" onSuccess={() => setShowImmediateForm(false)} />
        </DialogContent>
      </Dialog>



      <div className="mt-6 space-y-4">
        {branches.length > 1 && (
          <div className="px-3">
            <label className="text-xs text-white/70 mb-2 block">Filial Ativa</label>
            <Select
              value={activeBranch?.id || ""}
              onValueChange={(value) => {
                const branch = branches.find(b => b.id === value);
                if (branch) setActiveBranch(branch);
              }}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-lg transition hover:bg-white/10 ${
              isActive ? "bg-white/20" : "bg-white/5"
            }`
          }
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-white/20 text-white">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || user?.email || "Usuário"}
            </p>
            <p className="text-xs text-white/60 truncate">
              {user?.businessName || "Negócio"}
            </p>
            <div className="flex items-center gap-1 text-xs text-white/70">
              <Building2 className="h-3 w-3" />
              <span>{activeBranch?.name || "Carregando..."}</span>
            </div>
          </div>
        </NavLink>
        
        <Button
          variant="ghost"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 justify-start"
        >
          <LogOut size={18} />
          Sair
        </Button>
      </div>
    </aside>
  );
}
