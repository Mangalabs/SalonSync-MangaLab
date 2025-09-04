import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  Activity,
  Target,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'
import axios from '@/lib/axios'

export default function ProfessionalDashboard() {
  const { activeBranch } = useBranch()
  const { user } = useUser()
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  
  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  
  const getDateRange = () => {
    switch (selectedPeriod) {
      case 'today':
        return { startDate: today, endDate: today }
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { startDate: weekAgo.toISOString().split('T')[0], endDate: today }
      case 'month':
        return { startDate: startOfMonth, endDate: today }
      default:
        return { startDate: today, endDate: today }
    }
  }

  const { startDate, endDate } = getDateRange()

  // Primeiro buscar o Professional correto baseado no User
  const { data: professionalInfo, isLoading: professionalLoading } = useQuery({
    queryKey: ['user-professional', user?.id, activeBranch?.id],
    queryFn: async () => {
      if (!user?.id || !activeBranch?.id) {return null}
      
      console.log('🔍 Searching for professional with user:', user.id, 'in branch:', activeBranch.id)
      
      try {
        // Buscar todos os profissionais da filial
        const res = await axios.get(`/api/professionals?branchId=${activeBranch.id}`)
        console.log('📊 Found professionals:', res.data.length)
        
        // Procurar o profissional que corresponde ao usuário logado (por nome ou email)
        const professional = res.data.find((prof: any) => 
          prof.name.toLowerCase() === user.name?.toLowerCase() ||
          prof.id === user.id,
        )
        
        if (professional) {
          console.log('✅ Found matching professional:', professional.id, professional.name)
          return professional
        } else {
          console.warn('⚠️ No matching professional found for user:', user.name)
          return null
        }
      } catch (error) {
        console.error('❌ Error finding professional:', error)
        return null
      }
    },
    enabled: !!user?.id && !!activeBranch?.id,
    staleTime: 60000,
  })

  // Dados de comissão usando o Professional ID correto
  const { data: commissionData, isLoading: commissionLoading, error: commissionError } = useQuery({
    queryKey: ['professional-commission', professionalInfo?.id, startDate, endDate, activeBranch?.id],
    queryFn: async () => {
      if (!professionalInfo?.id) {
        console.log('❌ Commission: No professional ID found')
        return {
          professional: { id: user?.id, name: user?.name, commissionRate: 0 },
          summary: { totalAppointments: 0, totalRevenue: 0, totalCommission: 0 },
          dailyCommissions: [],
        }
      }
      
      console.log('💰 Loading commission for professional:', professionalInfo.id, 'period:', { startDate, endDate })
      
      try {
        const res = await axios.get(`/api/professionals/${professionalInfo.id}/commission?startDate=${startDate}&endDate=${endDate}`)
        console.log('✅ Commission loaded:', res.data)
        return res.data
      } catch (error: any) {
        console.error('❌ Commission error:', error)
        if (error.response?.status === 404) {
          console.warn('⚠️ Professional commission not found, returning empty data')
          return {
            professional: { id: professionalInfo.id, name: professionalInfo.name, commissionRate: professionalInfo.commissionRate || 0 },
            summary: { totalAppointments: 0, totalRevenue: 0, totalCommission: 0 },
            dailyCommissions: [],
          }
        }
        throw error
      }
    },
    enabled: !!professionalInfo?.id && !!activeBranch,
    staleTime: 30000,
    retry: 2,
  })

  // Dados de agendamentos usando o Professional ID correto
  const { data: appointmentsData, isLoading: appointmentsLoading, error: appointmentsError } = useQuery({
    queryKey: ['professional-appointments', professionalInfo?.id, startDate, today, activeBranch?.id],
    queryFn: async () => {
      if (!professionalInfo?.id) {
        console.log('❌ Appointments: No professional ID found')
        return {
          all: [],
          today: [],
          period: [],
        }
      }
      
      console.log('📋 Loading appointments for professional:', professionalInfo.id, 'period:', { startDate, endDate: today })
      
      try {
        const res = await axios.get(`/api/appointments?professionalId=${professionalInfo.id}&startDate=${startDate}&endDate=${today}`)
        console.log('✅ Appointments loaded:', res.data.length, 'appointments')
        
        const allAppointments = res.data
        const todayAppointments = allAppointments.filter((apt: any) => {
          const aptDate = new Date(apt.scheduledAt).toISOString().split('T')[0]
          return aptDate === today
        })
        
        const periodAppointments = allAppointments.filter((apt: any) => {
          const aptDate = new Date(apt.scheduledAt).toISOString().split('T')[0]
          return aptDate >= startDate && aptDate <= endDate
        })

        console.log('📊 Filtered appointments:', {
          total: allAppointments.length,
          today: todayAppointments.length,
          period: periodAppointments.length,
        })

        return {
          all: allAppointments,
          today: todayAppointments,
          period: periodAppointments,
        }
      } catch (error) {
        console.error('❌ Appointments error:', error)
        return {
          all: [],
          today: [],
          period: [],
        }
      }
    },
    enabled: !!professionalInfo?.id && !!activeBranch,
    staleTime: 30000,
    retry: 2,
  })

  const isLoading = professionalLoading || commissionLoading || appointmentsLoading
  const error = commissionError || appointmentsError
  
  // Combinar dados
  const professionalData = {
    commission: commissionData,
    appointments: appointmentsData?.period || [],
    todayAppointments: appointmentsData?.today || [],
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Meu Dashboard</h1>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
        <div className="text-center text-sm text-gray-500">
          Carregando dados do profissional...
        </div>
      </div>
    )
  }

  if (error) {
    console.error('❌ ProfessionalDashboard: Query error:', error)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Meu Dashboard</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Erro ao carregar dados do dashboard</p>
            <p className="text-sm text-gray-500 mt-2">
              Verifique o console para mais detalhes
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user?.id) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Meu Dashboard</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-yellow-600">Usuário não identificado</p>
            <p className="text-sm text-gray-500 mt-2">
              Faça login novamente
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatCurrency = (value: number) => `R$ ${(value || 0).toFixed(2)}`
  
  console.log('📊 ProfessionalDashboard: Rendering with data:', {
    user: user?.id,
    branch: activeBranch?.id,
    commissionLoading,
    appointmentsLoading,
    commissionData: commissionData ? 'loaded' : 'null',
    appointmentsData: appointmentsData ? `${appointmentsData.all?.length || 0} total` : 'null',
    commission: commissionData?.summary,
    appointmentsCount: professionalData?.appointments?.length || 0,
  })
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoje'
      case 'week': return 'Últimos 7 dias'
      case 'month': return 'Este mês'
      default: return 'Hoje'
    }
  }

  const completedAppointments = professionalData?.appointments?.filter((apt: any) => apt.status === 'COMPLETED') || []
  const scheduledAppointments = professionalData?.appointments?.filter((apt: any) => apt.status === 'SCHEDULED') || []
  const todayScheduled = professionalData?.todayAppointments?.filter((apt: any) => apt.status === 'SCHEDULED') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name}! 👋</h1>
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

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minha Comissão</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(professionalData?.commission?.summary?.totalCommission || 0)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {professionalData?.commission?.summary?.totalAppointments || 0} atendimentos
              </Badge>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(professionalData?.commission?.summary?.totalRevenue || 0)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {professionalData?.commission?.professional?.commissionRate || 0}% taxa
              </Badge>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {todayScheduled.length}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={todayScheduled.length > 0 ? 'default' : 'secondary'} className="text-xs">
                {todayScheduled.length > 0 ? 'Tem trabalho!' : 'Dia livre'}
              </Badge>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-violet-500"></div>
        </Card>
      </div>

      {/* Agendamentos de Hoje */}
      {todayScheduled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Meus Agendamentos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayScheduled.map((appointment: any) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{appointment.client.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {new Date(appointment.scheduledAt).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                        })}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      {appointment.appointmentServices?.map((as: any) => as.service.name).join(', ')}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {formatCurrency(Number(appointment.total))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Últimos Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedAppointments.length > 0 ? (
              <div className="space-y-2">
                {completedAppointments.slice(0, 3).map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{appointment.client.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(appointment.scheduledAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(Number(appointment.total))}
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-500">
                    {completedAppointments.length} atendimentos no período
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum atendimento no período</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Próximos 3 Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledAppointments.length > 0 ? (
              <div className="space-y-2">
                {scheduledAppointments.slice(0, 3).map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{appointment.client.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(appointment.scheduledAt).toLocaleDateString('pt-BR')} às {' '}
                        {new Date(appointment.scheduledAt).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                        })}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      {formatCurrency(Number(appointment.total))}
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-500">
                    {scheduledAppointments.length} agendamentos futuros
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum agendamento futuro</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meta de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Minha Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {professionalData?.commission?.summary?.totalAppointments || 0}
              </div>
              <div className="text-sm text-muted-foreground">Atendimentos no período</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {professionalData?.commission?.summary?.totalAppointments > 0 
                  ? (professionalData.commission.summary.totalRevenue / professionalData.commission.summary.totalAppointments).toFixed(0)
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Ticket médio (R$)</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {professionalData?.commission?.professional?.commissionRate || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de comissão</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}