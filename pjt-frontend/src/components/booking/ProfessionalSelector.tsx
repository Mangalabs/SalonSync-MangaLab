import React from 'react'
import { useBranchProfessionals } from '@/hooks/usePublicBooking'

interface ProfessionalSelectorProps {
  branchId: string
  onSelect: (professional: any) => void
  onBack: () => void
}

export function ProfessionalSelector({ branchId, onSelect, onBack }: ProfessionalSelectorProps) {
  const { data: professionals, isLoading } = useBranchProfessionals(branchId)

  if (isLoading) return <div>Carregando profissionais...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Escolha um profissional</h2>
      <div className="grid gap-4">
        {professionals?.map((professional: any) => (
          <button
            key={professional.id}
            onClick={() => onSelect(professional)}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-semibold">{professional.name}</h3>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="px-4 py-2 border rounded">
        Voltar
      </button>
    </div>
  )
}