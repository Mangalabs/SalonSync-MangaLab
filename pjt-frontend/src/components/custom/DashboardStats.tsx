import { useState } from 'react'
import { DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ProfessionalCommissionSummary } from './ProfessionalCommissionSummary'

interface DashboardStatsProps {
  todayRevenue: number;
  todayAppointments: number;
  monthlyRevenue: number;
}

export function DashboardStats({
  todayRevenue,
  todayAppointments,
  monthlyRevenue,
}: DashboardStatsProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  return (
    <div className="space-y-3">
      <Card className="cursor-pointer" onClick={() => toggleCard('revenue')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#D4AF37]" />
            {expandedCard === 'revenue' ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#D4AF37]">
            R$ {(todayRevenue + monthlyRevenue).toFixed(2)}
          </div>
          <p className="text-xs text-[#737373]">Total geral</p>
        </CardContent>
        {expandedCard === 'revenue' && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Receita Hoje</span>
                  <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div className="text-xl font-bold text-[#D4AF37]">
                  R$ {todayRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-[#737373]">
                  {todayAppointments} atendimentos hoje
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Receita Mensal</span>
                  <Calendar className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div className="text-xl font-bold text-[#D4AF37]">
                  R$ {monthlyRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-[#737373]">
                  {new Date().toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <ProfessionalCommissionSummary />
    </div>
  )
}
