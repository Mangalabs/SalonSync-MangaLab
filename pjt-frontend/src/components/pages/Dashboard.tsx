import { useUser } from "@/contexts/UserContext";
import AdminDashboard from "./AdminDashboard";
import ProfessionalDashboard from "./ProfessionalDashboard";

export default function Dashboard() {
  const { isAdmin } = useUser();
  
  return isAdmin ? <AdminDashboard /> : <ProfessionalDashboard />;
}