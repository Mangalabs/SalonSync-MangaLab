import { Sidebar } from "@/components/layout/Sidebar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
