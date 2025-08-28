import {
  Home,
  Users,
  ClipboardList,
  User,
  Warehouse,
  BarChart2,
  Settings,
  LogOut,
  Calendar,
  CheckSquare,
  DollarSign,
  ShoppingCart,
  MessageSquare,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AppointmentForm } from "@/components/custom/AppointmentForm";
import { ProductSaleForm } from "@/components/custom/ProductSaleForm";
import { UserMenu } from "@/components/custom/UserMenu";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useSidebar } from "@/contexts/SidebarContext";

const getNavItems = (userRole: string) => {
  const baseItems = [
    {
      to: "/dashboard",
      icon: Home,
      label: "Dashboard",
      roles: ["ADMIN", "PROFESSIONAL"],
    },
    {
      to: "/dashboard/clients",
      icon: User,
      label: "Clientes",
      roles: ["ADMIN", "PROFESSIONAL"],
    },
    {
      to: "/dashboard/services",
      icon: ClipboardList,
      label: "Serviços",
      roles: ["ADMIN", "PROFESSIONAL"],
    },
    {
      to: "/dashboard/inventory",
      icon: Warehouse,
      label: "Estoque",
      roles: ["ADMIN", "PROFESSIONAL"],
    },
  ];

  const adminItems = [
    {
      to: "/dashboard/professionals",
      icon: Users,
      label: "Profissionais",
      roles: ["ADMIN"],
    },
    //TODO: Termianr configuração antes de habilitar
    // {
    //   to: "/dashboard/whatsapp",
    //   icon: MessageSquare,
    //   label: "WhatsApp",
    //   roles: ["ADMIN"],
    // },
    {
      to: "/dashboard/financial",
      icon: DollarSign,
      label: "Financeiro",
      roles: ["ADMIN"],
    },
    {
      to: "/dashboard/reports",
      icon: BarChart2,
      label: "Relatórios",
      roles: ["ADMIN"],
    },
    {
      to: "/dashboard/settings",
      icon: Settings,
      label: "Configurações",
      roles: ["ADMIN", "PROFESSIONAL"],
    },
  ];

  const allItems = [...baseItems, ...adminItems];
  return allItems.filter((item) => {
    if (userRole === "SUPERADMIN") {
      return true;
    }
    return item.roles.includes(userRole);
  });
};

export function Sidebar() {
  const [showScheduledForm, setShowScheduledForm] = useState(false);
  const [showImmediateForm, setShowImmediateForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const { user, logout, isAdmin } = useUser();
  const { isOpen, close } = useSidebar();

  const navItems = getNavItems(user?.role || "ADMIN");

  const handleNavClick = () => {
    close();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`w-64 h-screen bg-[#1A1A1A] text-white flex flex-col px-4 py-6 fixed left-0 top-0 z-50 transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#D4AF37]">SalonSync</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="md:hidden text-white hover:bg-white/10 p-1"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex flex-col gap-1 flex-grow overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              onClick={handleNavClick}
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

          <NavLink
            to="/dashboard/appointments"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition hover:bg-white/10 ${
                isActive ? "bg-white/20 font-semibold" : ""
              }`
            }
          >
            <Calendar size={18} />
            Agendamentos
          </NavLink>

          <NavLink
            to="/dashboard/treatments"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition hover:bg-white/10 ${
                isActive ? "bg-white/20 font-semibold" : ""
              }`
            }
          >
            <CheckSquare size={18} />
            Atendimentos
          </NavLink>
        </div>

        <div className="mt-4 space-y-2">
          <Button
            onClick={() => setShowScheduledForm(true)}
            className="w-full bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#B8941F] text-xs sm:text-sm py-2 h-8"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Agendar</span>
          </Button>
          <Button
            onClick={() => setShowImmediateForm(true)}
            className="w-full bg-[#8B4513] text-white hover:bg-[#7A3E11] text-xs sm:text-sm py-2 h-8"
          >
            <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Novo Atendimento</span>
            <span className="sm:hidden">Atender</span>
          </Button>

          <Button
            onClick={() => setShowSaleForm(true)}
            className="w-full bg-green-600 text-white hover:bg-green-700 text-xs sm:text-sm py-2 h-8"
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Vender Produto</span>
            <span className="sm:hidden">Vender</span>
          </Button>
        </div>

        <Dialog open={showScheduledForm} onOpenChange={setShowScheduledForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              mode="scheduled"
              onSuccess={() => setShowScheduledForm(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showImmediateForm} onOpenChange={setShowImmediateForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Atendimento</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              mode="immediate"
              onSuccess={() => setShowImmediateForm(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Venda de Produto</DialogTitle>
            </DialogHeader>
            <ProductSaleForm onSuccess={() => setShowSaleForm(false)} />
          </DialogContent>
        </Dialog>

        <div className="mt-3 border-t border-white/20 pt-3">
          <UserMenu />
        </div>
      </aside>
    </>
  );
}
