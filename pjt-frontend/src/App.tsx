import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/components/pages/Home";
import Dashboard from "@/components/pages/Dashboard";
import Professionals from "@/components/pages/Professionals";
import Settings from "@/components/pages/Settings";
import { PrivateRoute } from "@/lib/PrivateRoute";
import { DashboardLayout } from "./components/layout/DashBoardLayout";
import Services from "./components/pages/Services";
import Clients from "./components/pages/Clients";
import Scheduling from "./components/pages/Scheduling";
import Appointments from "./components/pages/Appointments";
import Treatments from "./components/pages/Treatments";
import Inventory from "./components/pages/Inventory";
import Reports from "./pages/Reports";
import Financial from "./pages/Financial";
import WhatsApp from "./components/pages/WhatsApp";
import { BranchProvider } from "@/contexts/BranchContext";
import { UserProvider } from "@/contexts/UserContext";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <BranchProvider>
                  <DashboardLayout />
                </BranchProvider>
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="professionals" element={
              <RoleGuard allowedRoles={["ADMIN"]}>
                <Professionals />
              </RoleGuard>
            } />
            <Route path="services" element={
              <RoleGuard allowedRoles={["ADMIN", "PROFESSIONAL"]}>
                <Services />
              </RoleGuard>
            } />
            <Route path="clients" element={
              <RoleGuard allowedRoles={["ADMIN", "PROFESSIONAL"]}>
                <Clients />
              </RoleGuard>
            } />
            <Route path="scheduling" element={<Scheduling />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="treatments" element={<Treatments />} />
            <Route path="inventory" element={
              <RoleGuard allowedRoles={["ADMIN", "PROFESSIONAL"]}>
                <Inventory />
              </RoleGuard>
            } />
            <Route path="reports" element={
              <RoleGuard allowedRoles={["ADMIN"]}>
                <Reports />
              </RoleGuard>
            } />
            <Route path="financial" element={
              <RoleGuard allowedRoles={["ADMIN"]}>
                <Financial />
              </RoleGuard>
            } />
            <Route path="whatsapp" element={
              <RoleGuard allowedRoles={["ADMIN"]}>
                <WhatsApp />
              </RoleGuard>
            } />
            <Route path="settings" element={
              <RoleGuard allowedRoles={["ADMIN", "PROFESSIONAL"]}>
                <Settings />
              </RoleGuard>
            } />
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </UserProvider>
    </>
  );
}
