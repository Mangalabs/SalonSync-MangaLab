import { Sidebar } from "@/components/layout/Sidebar";
import { Outlet } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { FirstTimeSetup } from "@/components/custom/FirstTimeSetup";
import { useState } from "react";

export function DashboardLayout() {
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
      <main className="flex-1 p-4 md:p-6 bg-[#F5F5F0] min-h-screen ml-64">
        <Outlet />
      </main>
    </div>
  );
}
