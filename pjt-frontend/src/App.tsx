import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/components/pages/Home";
import Login from "@/components/pages/Login";
import Register from "@/components/pages/Register";
import Dashboard from "@/components/pages/Dashboard";
import Professionals from "@/components/pages/Professionals";
import { PrivateRoute } from "@/lib/PrivateRoute";
import { DashboardLayout } from "./components/layout/DashBoardLayout";
import Services from "./components/pages/Services";

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
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="professionals" element={<Professionals />} />
          <Route path="services" element={<Services />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
