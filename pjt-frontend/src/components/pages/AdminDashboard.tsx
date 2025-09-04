import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  TrendingUp, 
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Target,
  Zap,
  RefreshCw,
  FileText,
  CreditCard,
  TrendingDown,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBranch } from '@/contexts/BranchContext'
import { PendingExpensesNotification } from '@/components/custom/PendingExpensesNotification'
import axios from '@/lib/axios'

export default function AdminDashboard() {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  
  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  
  const getDateRange = () => {
    switch (selectedPeriod) {
      case 'today':
        return { startDate: today, endDate: today }
      case 'week':{
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { startDate: weekAgo.toISOString().split('T')[0], endDate: today }
      }
      case 'month':
        return { startDate: startOfMonth, endDate: today }
      default:
        return { startDate: today, endDate: today }
    }
  }

  const { startDate, endDate } = getDateRange()

  // Dashboard Summary Data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-summary', startDate, endDate, activeBranch?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate })
      if (activeBranch?.id) {params.append('branchId', activeBranch.id)}

      const [financialRes, appointmentsRes, professionalsRes, recurringRes] = await Promise.all([
        axios.get(`/api/financial/summary?${params}`),
        axios.get(`/api/appointments?status=COMPLETED&${params}`),
        axios.get(`/api/professionals?${activeBranch?.id ? `branchId=${activeBranch.id}` : ''}`),
        axios.get('/api/financial/recurring-expenses/pending'),
      ])

      // Calculate commissions for each professional
      const commissionPromises = professionalsRes.data.map(async (prof: any) => {
        try {
          const res = await axios.get(`/api/professionals/${prof.id}/commission?${params}`)
          return { ...prof, commission: res.data.summary }
        } catch {
          return { ...prof, commission: { totalCommission: 0, totalAppointments: 0, totalRevenue: 0 } }
        }
      })

      const professionalsWithCommissions = await Promise.all(commissionPromises)

      return {
        financial: financialRes.data,
        appointments: appointmentsRes.data,
        professionals: professionalsWithCommissions,
        pendingExpenses: recurringRes.data,
        totalProfessionals: professionalsRes.data.length,
        activeProfessionals: professionalsWithCommissions.filter(p => p.commission.totalAppointments > 0).length,
      }
    },
    enabled: !!activeBranch,
    refetchInterval: 300000, // 5 minutes
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="bg-gray-200 h-4 w-20 rounded"></div>
                  <div className="bg-gray-200 h-8 w-24 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoje'
      case 'week': return 'Últimos 7 dias'
      case 'month': return 'Este mês'
      default: return 'Hoje'
    }
  }

  // Calculate metrics
  const totalRevenue = dashboardData?.financial?.totalIncome || 0
  const totalExpenses = dashboardData?.financial?.totalExpenses || 0
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Top performing professional
  const topProfessional = dashboardData?.professionals?.length > 0 
    ? dashboardData.professionals.reduce((prev: any, current: any) => 
      (current.commission.totalRevenue > prev.commission.totalRevenue) ? current : prev,
    )
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {activeBranch?.name} • {getPeriodLabel()}
          </p>
        </div>
        
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">7 dias</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pending Expenses Alert */}
      <PendingExpensesNotification />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {dashboardData?.appointments?.length || 0} atendimentos
              </Badge>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <Target className={`h-4 w-4 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={profitMargin >= 20 ? 'default' : profitMargin >= 10 ? 'secondary' : 'destructive'} className="text-xs">
                {profitMargin.toFixed(1)}% margem
              </Badge>
            </div>
          </CardContent>
          <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${netProfit >= 0 ? 'from-blue-500 to-cyan-500' : 'from-red-500 to-pink-500'}`}></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData?.activeProfessionals || 0}/{dashboardData?.totalProfessionals || 0}
            </div>
            <div className="mt-2">
              <Progress 
                value={dashboardData?.totalProfessionals ? (dashboardData.activeProfessionals / dashboardData.totalProfessionals) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-violet-500"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Pendentes</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${dashboardData?.pendingExpenses?.length > 0 ? 'text-orange-600' : 'text-green-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboardData?.pendingExpenses?.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {dashboardData?.pendingExpenses?.length || 0}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {dashboardData?.pendingExpenses?.length === 0 ? (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Em dia
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Ação necessária
                </Badge>
              )}
            </div>
          </CardContent>
          <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${dashboardData?.pendingExpenses?.length > 0 ? 'from-orange-500 to-red-500' : 'from-green-500 to-emerald-500'}`}></div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Receitas</span>
                    <span className="text-sm text-green-600">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Despesas</span>
                    <span className="text-sm text-red-600">{formatCurrency(totalExpenses)}</span>
                  </div>
                  <Progress 
                    value={totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardData?.financial?.appointmentRevenue || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Atendimentos</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(dashboardData?.financial?.stockRevenue || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Vendas Produtos</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(dashboardData?.financial?.totalInvestments || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Investimentos</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Professional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Destaque do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProfessional && topProfessional.commission.totalRevenue > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{topProfessional.name}</h3>
                  <p className="text-sm text-muted-foreground">{topProfessional.customRole?.title || 'Profissional'}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Receita Gerada</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(topProfessional.commission.totalRevenue)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Atendimentos</span>
                    <span className="font-semibold">{topProfessional.commission.totalAppointments}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Comissão</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(topProfessional.commission.totalCommission)}
                    </span>
                  </div>
                </div>

                <Badge className="w-full justify-center bg-gradient-to-r from-yellow-500 to-orange-500">
                  🏆 Melhor Performance
                </Badge>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade registrada no período
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<RefreshCw className="h-6 w-6 text-blue-600" />}
              title="Atualizar Dados"
              description="Recarregar informações"
              onClick={() => {
                queryClient.invalidateQueries()
                toast.success('Dados atualizados!')
              }}
              className="hover:bg-blue-50 hover:border-blue-200"
            />
            
            <QuickActionButton
              icon={<CreditCard className="h-6 w-6 text-green-600" />}
              title="Pagar Despesas"
              description={`${dashboardData?.pendingExpenses?.length || 0} pendentes`}
              onClick={() => window.location.href = '/financial?tab=expenses'}
              className="hover:bg-green-50 hover:border-green-200"
              disabled={!dashboardData?.pendingExpenses?.length}
            />
            
            <QuickActionButton
              icon={<FileText className="h-6 w-6 text-purple-600" />}
              title="Relatório Diário"
              description="Exportar dados"
              onClick={() => {
                const data = {
                  periodo: getPeriodLabel(),
                  receita: formatCurrency(totalRevenue),
                  despesas: formatCurrency(totalExpenses),
                  lucro: formatCurrency(netProfit),
                  atendimentos: dashboardData?.appointments?.length || 0,
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `relatorio-${today}.json`
                a.click()
                toast.success('Relatório exportado!')
              }}
              className="hover:bg-purple-50 hover:border-purple-200"
            />
            
            <QuickActionButton
              icon={<TrendingDown className="h-6 w-6 text-orange-600" />}
              title="Análise de Custos"
              description={`${((totalExpenses/totalRevenue)*100 || 0).toFixed(0)}% da receita`}
              onClick={() => {
                const analysis = {
                  margemLucro: `${profitMargin.toFixed(1)}%`,
                  custoOperacional: `${((totalExpenses/totalRevenue)*100 || 0).toFixed(1)}%`,
                  recomendacao: profitMargin < 20 ? 'Revisar custos' : 'Margem saudável',
                }
                toast.info(`Margem: ${analysis.margemLucro} | ${analysis.recomendacao}`)
              }}
              className="hover:bg-orange-50 hover:border-orange-200"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickActionButton({ icon, title, description, onClick, className, disabled = false }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Button 
      variant="outline" 
      className={`h-20 flex-col gap-1 p-4 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon}
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground text-center">{description}</span>
    </Button>
  )
}