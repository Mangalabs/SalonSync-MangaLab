import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/components/pages/Home";
import Login from "@/components/pages/Login";
import Register from "@/components/pages/Register";
import Dashboard from "@/components/pages/Dashboard";
import Professionals from "@/components/pages/Professionals";
import Settings from "@/components/pages/Settings";
import { PrivateRoute } from "@/lib/PrivateRoute";
import { DashboardLayout } from "./components/layout/DashBoardLayout";
import Services from "./components/pages/Services";
import Clients from "./components/pages/Clients";
import Appointments from "./components/pages/Appointments";
import { BranchProvider } from "@/contexts/BranchContext";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
          <Route path="professionals" element={<Professionals />} />
          <Route path="services" element={<Services />} />
          <Route path="clients" element={<Clients />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
