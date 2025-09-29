import { ProfessionalTable } from '@/components/custom/professional/ProfessionalTable'
import { ProfessionalAbsenceManagement } from '@/components/custom/professional/ProfessionalAbsenceManagement'

export default function Professionals() {
  return (
    <div className="space-y-6">
      <ProfessionalTable />
      <ProfessionalAbsenceManagement />
    </div>
  )
}