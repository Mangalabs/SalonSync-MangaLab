import { Sidebar } from "@/components/layout/Sidebar";
import { Outlet } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { FirstTimeSetup } from "@/components/custom/FirstTimeSetup";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

function DashboardContent() {
  const { toggle } = useSidebar();
  const { user, isAdmin } = useUser();
  const [showSetup, setShowSetup] = useState(false);
  
  // Verificar se é primeiro acesso (admin sem businessName)
  const isFirstTime = isAdmin && user && !user.businessName;
  
  if (isFirstTime && !showSetup) {
    setShowSetup(true);
  }
  
  if (showSetup) {
    return <FirstTimeSetup onComplete={() => setShowSetup(false)} />;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-[#F5F5F0] min-h-screen ml-0 md:ml-64">
        {/* Header mobile */}
        <div className="md:hidden bg-white border-b border-gray-200 p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="text-[#1A1A1A] hover:bg-gray-100 p-2 h-8 w-8"
          >
            <Menu size={18} />
          </Button>
          <h1 className="text-base font-semibold text-[#1A1A1A]">SalonSync</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>
        
        <div className="p-3 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}
