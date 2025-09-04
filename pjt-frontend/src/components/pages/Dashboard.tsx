import AdminDashboard from './AdminDashboard'
import ProfessionalDashboard from './ProfessionalDashboard'

import { useUser } from '@/contexts/UserContext'

export default function Dashboard() {
  const { isAdmin } = useUser()
  
  return isAdmin ? <AdminDashboard /> : <ProfessionalDashboard />
}