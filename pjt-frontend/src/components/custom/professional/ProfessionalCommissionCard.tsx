import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DollarSign, BarChart3, RefreshCw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

interface ProfessionalCommissionCardProps {
  professionalId?: string;
}

export function ProfessionalCommissionCard({ professionalId }: ProfessionalCommissionCardProps) {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()

  const { data: professional, isFetching: fetchingProfessional } = useQuery({
    queryKey: ['professional', professionalId, activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get(`/api/professionals/${professionalId}`)
      return res.data
    },
    enabled: !!professionalId,
  })

  const { data: monthlyCommission, isFetching: fetchingMonthly } = useQuery({
    queryKey: ['monthly-commission', professionalId, activeBranch?.id],
    queryFn: async () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      const res = await axios.get(`/api/professionals/${professionalId}/commission?startDate=${start}&endDate=${end}`)
      return res.data
    },
    enabled: !!professionalId,
  })

  const { data: dailyCommission, isFetching: fetchingDaily } = useQuery({
    queryKey: ['daily-commission', professionalId, activeBranch?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const res = await axios.get(`/api/professionals/${professionalId}/commission?startDate=${today}&endDate=${today}`)
      return res.data
    },
    enabled: !!professionalId,
  })

  const handleRefresh = () => {
    if (professionalId) {
      queryClient.invalidateQueries({ queryKey: ['monthly-commission', professionalId] })
      queryClient.invalidateQueries({ queryKey: ['daily-commission', professionalId] })
      queryClient.invalidateQueries({ queryKey: ['professional', professionalId] })
    }
  }

  if (!professional) {return <p>Carregando profissional...</p>}

  const isLoading = fetchingProfessional || fetchingMonthly || fetchingDaily

  const getWeekdayAbbr = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { weekday: 'short' })
  }

  const getLast7Days = () => {
    const result: any[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      const commissionDay = monthlyCommission?.dailyCommissions?.find((d: any) => d.date === dateKey)
      result.push({
        date: dateKey,
        day: date.getDate(),
        dayName: getWeekdayAbbr(dateKey),
        commission: commissionDay?.commission || 0,
      })
    }
    return result
  }

  const last7Days = getLast7Days()
  const maxCommission = Math.max(...last7Days.map(d => d.commission), 0)

  return (
    <div className="bg-gray-50 px-6 py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h4 className="text-xl font-semibold text-gray-800">{professional.name}</h4>
        <Button
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 transition-transform ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Comissão Mensal</CardTitle>
            <DollarSign className="text-green-500 w-5 h-5" />
          </CardHeader>
          <CardContent>
            {fetchingMonthly ? (
              <p className="text-gray-500">Carregando...</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  R$ {monthlyCommission?.summary?.totalCommission?.toFixed(2) || '0,00'}
                </div>
                <p className="text-sm text-gray-600">
                  {monthlyCommission?.summary?.totalAppointments || 0} atendimentos este mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Comissão Hoje</CardTitle>
            <DollarSign className="text-blue-500 w-5 h-5" />
          </CardHeader>
          <CardContent>
            {fetchingDaily ? (
              <p className="text-gray-500">Carregando...</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {dailyCommission?.summary?.totalCommission?.toFixed(2) || '0,00'}
                </div>
                <p className="text-sm text-gray-600">
                  {dailyCommission?.summary?.totalAppointments || 0} atendimentos hoje
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Performance dos Últimos 7 Dias</CardTitle>
          <BarChart3 className="w-5 h-5 text-purple-500" />
        </CardHeader>
        <CardContent className="grid grid-cols-7 gap-3">
          {fetchingMonthly ? (
            <p className="text-gray-500 col-span-7 text-center">Carregando gráfico...</p>
          ) : (
            last7Days.map(day => {
              const height = maxCommission > 0 ? Math.max((day.commission / maxCommission) * 100, 5) : 5
              return (
                <div key={day.date} className="text-center">
                  <div className="h-20 flex items-end justify-center mb-2">
                    <div className="w-6 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-md" style={{ height: `${height}%` }} />
                  </div>
                  <div className="text-sm text-gray-600">{day.dayName} {day.day}</div>
                  <div className="text-sm font-semibold text-purple-600">R$ {day.commission.toFixed(2)}</div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
