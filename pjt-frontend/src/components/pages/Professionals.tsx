import { ProfessionalTable } from '@/components/custom/professional/ProfessionalTable'

export default function Professionals() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Profissionais</h1>
          <p className="text-gray-600 text-sm mt-1">
            Para adicionar novos profissionais, acesse{' '}
            <strong>Configurações → Funcionários</strong>
          </p>
        </div>
      </div>

      <ProfessionalTable />
    </div>
  )
}
