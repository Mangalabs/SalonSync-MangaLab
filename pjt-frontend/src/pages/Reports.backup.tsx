import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  DollarSign,
  User,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import axios from '@/lib/axios'

type PeriodType = 'today' | 'week' | 'month' | 'year';

export default function Reports() {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  )
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  )

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data
    },
  })

  const getDateRange = () => {
    const now = new Date()
    let startDate: string, endDate: string

    switch (periodType) {
      case 'today':
        startDate = endDate = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        startDate = weekStart.toISOString().split('T')[0]
        endDate = weekEnd.toISOString().split('T')[0]
        break
      case 'month':
        const [year, month] = selectedMonth.split('-')
        startDate = `${year}-${month}-01`
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
        endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`
        break
      case 'year':
        startDate = `${selectedYear}-01-01`
        endDate = `${selectedYear}-12-31`
        break
      default:
        startDate = endDate = now.toISOString().split('T')[0]
    }

    return { startDate, endDate }
  }

  const { data: commissionData, refetch: refetchCommission } = useQuery({
    queryKey: [
      'commission',
      selectedProfessional,
      periodType,
      selectedMonth,
      selectedYear,
    ],
    queryFn: async () => {
      if (!selectedProfessional) {return null}

      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams()
      params.append('startDate', startDate)
      params.append('endDate', endDate)

      const res = await axios.get(
        `/api/professionals/${selectedProfessional}/commission?${params}`,
      )
      return res.data
    },
    enabled: !!selectedProfessional,
  })

  const { data: financialData, refetch: refetchFinancial } = useQuery({
    queryKey: ['financial-report', periodType, selectedMonth, selectedYear],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams()
      params.append('startDate', startDate)
      params.append('endDate', endDate)

      const res = await axios.get(`/api/financial/summary?${params}`)
      return res.data
    },
  })

  const handleGenerateReport = () => {
    if (selectedProfessional) {
      refetchCommission()
    }
    refetchFinancial()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Relatório do Período
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="professional">Profissional</Label>
              <Select
                value={selectedProfessional}
                onValueChange={setSelectedProfessional}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof: any) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="period">Período</Label>
              <Select
                value={periodType}
                onValueChange={(value: PeriodType) => setPeriodType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Mês Específico</SelectItem>
                  <SelectItem value="year">Ano Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodType === 'month' && (
              <div>
                <Label htmlFor="month">Mês/Ano</Label>
                <input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-[#F5F5F0] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#737373] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}

            {periodType === 'year' && (
              <div>
                <Label htmlFor="year">Ano</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end gap-2">
              <Button onClick={handleGenerateReport} className="flex-1">
                Gerar Relatório
              </Button>

              {(financialData || commissionData) && (
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="px-4"
                >
                  Exportar PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {(financialData || commissionData) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Relatório{' '}
                  {periodType === 'today'
                    ? 'Diário'
                    : periodType === 'week'
                      ? 'Semanal'
                      : periodType === 'month'
                        ? 'Mensal'
                        : 'Anual'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Período:{' '}
                  {periodType === 'month'
                    ? new Date(selectedMonth + '-01').toLocaleDateString(
                      'pt-BR',
                      { month: 'long', year: 'numeric' },
                    )
                    : periodType === 'year'
                      ? selectedYear
                      : periodType === 'today'
                        ? 'Hoje'
                        : 'Esta Semana'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Gerado em: {new Date().toLocaleDateString('pt-BR')}
                </p>
                {selectedProfessional && commissionData && (
                  <p className="text-sm font-medium text-gray-700">
                    Profissional: {commissionData.professional.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {financialData && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#D4AF37]">
                  R$ {financialData.totalIncome?.toFixed(2) || '0,00'}
                </div>
                <p className="text-xs text-[#737373]">
                  Atendimentos: R${' '}
                  {financialData.appointmentRevenue?.toFixed(2) || '0,00'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {financialData.totalExpenses?.toFixed(2) || '0,00'}
                </div>
                <p className="text-xs text-[#737373]">Gastos operacionais</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Investimentos
                </CardTitle>
                <PiggyBank className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {financialData.totalInvestments?.toFixed(2) || '0,00'}
                </div>
                <p className="text-xs text-[#737373]">
                  Melhorias e equipamentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lucro Líquido
                </CardTitle>
                <DollarSign
                  className={`h-4 w-4 ${
                    (financialData.netProfit || 0) >= 0
                      ? 'text-[#D4AF37]'
                      : 'text-red-600'
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    (financialData.netProfit || 0) >= 0
                      ? 'text-[#D4AF37]'
                      : 'text-red-600'
                  }`}
                >
                  R$ {financialData.netProfit?.toFixed(2) || '0,00'}
                </div>
                <p className="text-xs text-[#737373]">
                  Receitas - Despesas - Investimentos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {commissionData && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">
            Comissões - {commissionData.professional.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Atendimentos
                </CardTitle>
                <User className="h-4 w-4 text-[#737373]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A1A1A]">
                  {commissionData.summary.totalAppointments}
                </div>
                <p className="text-xs text-[#737373]">No período selecionado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Gerada
                </CardTitle>
                <DollarSign className="h-4 w-4 text-[#737373]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A1A1A]">
                  R$ {commissionData.summary.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-[#737373]">
                  Receita bruta do profissional
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comissão</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#737373]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A1A1A]">
                  R$ {commissionData.summary.totalCommission.toFixed(2)}
                </div>
                <p className="text-xs text-[#737373]">
                  {commissionData.professional.commissionRate}% de comissão
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {financialData && commissionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análise do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Performance Financeira</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Margem de Lucro</span>
                    <span
                      className={`font-medium ${
                        (financialData.netProfit || 0) >= 0
                          ? 'text-[#D4AF37]'
                          : 'text-red-600'
                      }`}
                    >
                      {financialData.totalIncome
                        ? (
                          (financialData.netProfit /
                              financialData.totalIncome) *
                            100
                        ).toFixed(1)
                        : '0'}
                      %
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Eficiência Operacional</span>
                    <span className="font-medium">
                      {financialData.totalIncome && financialData.totalExpenses
                        ? (
                          (financialData.totalIncome /
                              financialData.totalExpenses) *
                            100
                        ).toFixed(0)
                        : '0'}
                      %
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">ROI Investimentos</span>
                    <span className="font-medium text-blue-600">
                      {financialData.totalInvestments &&
                      financialData.totalInvestments > 0
                        ? (
                          (financialData.netProfit /
                              financialData.totalInvestments) *
                            100
                        ).toFixed(1)
                        : '0'}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Distribuição de Custos</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comissões Pagas</span>
                    <span className="font-medium text-orange-600">
                      R$ {commissionData.summary.totalCommission.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">% da Receita em Comissões</span>
                    <span className="font-medium">
                      {financialData.appointmentRevenue
                        ? (
                          (commissionData.summary.totalCommission /
                              financialData.appointmentRevenue) *
                            100
                        ).toFixed(1)
                        : '0'}
                      %
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Receita por Atendimento</span>
                    <span className="font-medium">
                      R${' '}
                      {commissionData.summary.totalAppointments > 0
                        ? (
                          commissionData.summary.totalRevenue /
                            commissionData.summary.totalAppointments
                        ).toFixed(2)
                        : '0,00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {commissionData && commissionData.dailyCommissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalhamento Diário - {commissionData.professional.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commissionData.dailyCommissions.map((day: any) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {new Date(day.date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-[#737373]">
                      {day.appointments} atendimento(s)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      R$ {day.commission.toFixed(2)}
                    </div>
                    <div className="text-sm text-[#737373]">
                      de R$ {day.revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
