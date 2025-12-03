import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Activity,
  Target,
  PlusCircle,
  UserPlus,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'
import { ScheduledAppointmentForm } from '@/components/custom/appointment/ScheduledAppointmentForm'
import { ImmediateAppointmentForm } from '@/components/custom/appointment/ImmediateAppointmentForm'
import axios from '@/lib/axios'
import { DateTime } from '@/utils/dateTime'

import { StatsCard } from '../ui/stats-card'

export default function ProfessionalDashboard() {
  const navigate = useNavigate()
  const { activeBranch } = useBranch()
  const { user } = useUser()
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)

  const today = DateTime.now().format('YYYY-MM-DD')
  const startOfMonth = DateTime.startOf(DateTime.now(), 'month').format(
    'YYYY-MM-DD'
  )

  const getDateRange = () => {
    switch (selectedPeriod) {
      case 'today':
        return { startDate: today, endDate: today }
      case 'week': {
        const weekAgo = DateTime.subtract(DateTime.now(), 7, 'day')
        return {
          startDate: weekAgo.format('YYYY-MM-DD'),
          endDate: today,
        }
      }
      case 'month':
        return { startDate: startOfMonth, endDate: today }
      default:
        return { startDate: today, endDate: today }
    }
  }

  const { startDate, endDate } = getDateRange()

  const { data: allAppointments = [] } = useQuery({
    queryKey: ['appointments', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/appointments')
      return res.data
    },
    enabled: !!activeBranch,
  })

  const userAppointments = useMemo(() => {
    if (!user?.name) return []

    return allAppointments.filter((apt: any) => {
      if (user.role === 'ADMIN' || user.role === 'OWNER') {
        return true
      }
      return apt.professional?.name?.toLowerCase() === user.name?.toLowerCase()
    })
  }, [allAppointments, user?.name, user?.role])

  const todayAppointments = userAppointments.filter((apt: any) => {
    const aptDate = apt.scheduledAt?.toString().split('T')[0]
    return aptDate === today
  })

  const periodAppointments = userAppointments.filter((apt: any) => {
    const aptDate = apt.scheduledAt?.toString().split('T')[0]
    return aptDate >= startDate && aptDate <= endDate
  })

  const appointmentsData = {
    all: userAppointments,
    today: todayAppointments,
    period: periodAppointments,
  }

  const {
    data: commissionData,
    isLoading: commissionLoading,
    error: commissionError,
  } = useQuery({
    queryKey: [
      'professional-commission',
      user?.name,
      startDate,
      endDate,
      activeBranch?.id,
    ],
    queryFn: async () => {
      return {
        professional: { id: user?.id, name: user?.name, commissionRate: 0 },
        summary: {
          totalAppointments: 0,
          totalRevenue: 0,
          totalCommission: 0,
        },
        dailyCommissions: [],
      }
    },
    enabled: !!user?.name && !!activeBranch,
    staleTime: 30000,
    retry: 2,
  })

  const isLoading = commissionLoading
  const error = commissionError

  const professionalData = {
    commission: commissionData,
    appointments: appointmentsData.period,
    todayAppointments: appointmentsData.today,
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <Skeleton className='h-8 w-48 mb-2' />
            <Skeleton className='h-4 w-32' />
          </div>
          <Skeleton className='h-10 w-48' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className='relative overflow-hidden'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-4' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-20 mb-2' />
                <Skeleton className='h-5 w-16' />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-40' />
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                    <div className='flex-1'>
                      <Skeleton className='h-4 w-24 mb-1' />
                      <Skeleton className='h-3 w-16' />
                    </div>
                    <Skeleton className='h-4 w-12' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-40' />
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                    <div className='flex-1'>
                      <Skeleton className='h-4 w-24 mb-1' />
                      <Skeleton className='h-3 w-20' />
                    </div>
                    <Skeleton className='h-4 w-12' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='text-center'>
                  <Skeleton className='h-8 w-12 mx-auto mb-2' />
                  <Skeleton className='h-4 w-24 mx-auto' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold'>Meu Dashboard</h1>
        <Card>
          <CardContent className='p-6 text-center'>
            <p className='text-red-600'>Erro ao carregar dados do dashboard</p>
            <p className='text-sm text-gray-500 mt-2'>
              Verifique o console para mais detalhes
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user?.id) {
    return (
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold'>Meu Dashboard</h1>
        <Card>
          <CardContent className='p-6 text-center'>
            <p className='text-yellow-600'>Usuário não identificado</p>
            <p className='text-sm text-gray-500 mt-2'>Faça login novamente</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatCurrency = (value: number) => `R$ ${(value || 0).toFixed(2)}`

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'Hoje'
      case 'week':
        return 'Últimos 7 dias'
      case 'month':
        return 'Este mês'
      default:
        return 'Hoje'
    }
  }

  const completedAppointments =
    professionalData?.appointments?.filter(
      (apt: any) => apt.status === 'COMPLETED'
    ) || []
  const todayCompletedAppointments =
    professionalData?.todayAppointments?.filter(
      (apt: any) => apt.status === 'COMPLETED'
    ) || []
  const scheduledAppointments =
    professionalData?.appointments?.filter(
      (apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED'
    ) || []
  const todayScheduled =
    professionalData?.todayAppointments?.filter(
      (apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED'
    ) || []

  const quickActions = [
    {
      id: 'appointments',
      icon: Calendar,
      label: 'Agendar Atendimento',
      openForm: true,
      color: 'blue',
    },
    {
      id: 'register-appointment',
      icon: PlusCircle,
      label: 'Registrar Atendimento',
      openRegisterForm: true,
      color: 'purple',
    },
    {
      id: 'clients',
      icon: UserPlus,
      label: 'Novo Cliente',
      route: '/dashboard/clients',
      color: 'orange',
    },
    {
      id: 'view-clients',
      icon: Users,
      label: 'Ver Clientes',
      route: '/dashboard/clients',
      color: 'green',
    },
  ]

  const actionColors: Record<string, string> = {
    purple:
      'border-purple-300 hover:border-purple-400 hover:bg-purple-50 text-purple-600',
    blue: 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600',
    green:
      'border-green-300 hover:border-green-400 hover:bg-green-50 text-green-600',
    orange:
      'border-orange-300 hover:border-orange-400 hover:bg-orange-50 text-orange-600',
  }

  return (
    <div className='space-y-4 md:space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>
            Olá, {user?.name}! 👋
          </h1>
          <p className='text-sm md:text-base text-muted-foreground'>
            {activeBranch?.name} • {getPeriodLabel()}
            {(user?.role === 'ADMIN' || user?.role === 'OWNER') &&
              ' • Visão Geral'}
          </p>
        </div>

        <Tabs
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          className='w-auto'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='today'>Hoje</TabsTrigger>
            <TabsTrigger value='week'>7 dias</TabsTrigger>
            <TabsTrigger value='month'>Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className='bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100'>
        <div className='flex justify-between items-center mb-3 md:mb-4'>
          <h3 className='text-sm md:text-base font-semibold text-gray-800'>
            Ações Rápidas
          </h3>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3'>
          {quickActions.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                if (a.openForm) {
                  setShowAppointmentForm(true)
                } else if (a.openRegisterForm) {
                  setShowRegisterForm(true)
                } else if (a.route) {
                  navigate(a.route)
                }
              }}
              className={`flex flex-col items-center p-3 md:p-4 rounded-lg border-2 border-dashed transition-all hover:shadow-md ${
                actionColors[a.color]
              }`}>
              <a.icon className='w-5 h-5 md:w-6 md:h-6 mb-1 md:mb-2' />
              <span className='text-xs md:text-sm font-medium text-center'>
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
        <StatsCard
          title='Minha Comissão'
          value={formatCurrency(
            professionalData?.commission?.summary?.totalCommission || 0
          )}
          change={`${
            professionalData?.commission?.summary?.totalAppointments || 0
          } atendimentos`}
          changeType='neutral'
          icon={DollarSign}
          iconColor='green'
        />
        <StatsCard
          title='Receita Gerada'
          value={formatCurrency(
            professionalData?.commission?.summary?.totalRevenue || 0
          )}
          change={`${
            professionalData?.commission?.professional?.commissionRate || 0
          }% taxa`}
          changeType='neutral'
          icon={TrendingUp}
          iconColor='blue'
        />
        <StatsCard
          title='Agendamentos Hoje'
          value={todayScheduled.length.toString()}
          change={todayScheduled.length > 0 ? 'Tem trabalho!' : 'Dia livre'}
          changeType={todayScheduled.length > 0 ? 'positive' : 'neutral'}
          icon={Calendar}
          iconColor='purple'
        />
        <StatsCard
          title='Atendimentos Hoje'
          value={todayCompletedAppointments.length.toString()}
          change={
            todayCompletedAppointments.length > 0
              ? 'Produtivo!'
              : 'Sem atendimentos'
          }
          changeType={
            todayCompletedAppointments.length > 0 ? 'positive' : 'neutral'
          }
          icon={CheckCircle}
          iconColor='orange'
        />
      </div>

      {todayScheduled.length > 0 && (
        <div className='bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100'>
          <h3 className='text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
            <Clock className='h-4 w-4 md:h-5 md:w-5' />
            Meus Agendamentos de Hoje
          </h3>
          <div className='space-y-3'>
            {todayScheduled.map((appointment: any) => (
              <div
                key={appointment.id}
                className='flex items-center justify-between p-3 border rounded-lg bg-blue-50'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='font-medium text-sm'>
                      {appointment.client.name}
                    </h4>
                    <Badge variant='outline' className='text-xs'>
                      {appointment.scheduledAt
                        ?.toString()
                        .split('T')[1]
                        ?.slice(0, 5) || '00:00'}
                    </Badge>
                  </div>
                  <div className='text-xs text-gray-600'>
                    {appointment.appointmentServices
                      ?.map((as: any) => as.service.name)
                      .join(', ')}
                  </div>
                </div>
                <div className='text-sm font-semibold text-blue-600'>
                  {formatCurrency(Number(appointment.total))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {todayCompletedAppointments.length > 0 && (
        <div className='bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100'>
          <h3 className='text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
            <CheckCircle className='h-4 w-4 md:h-5 md:w-5 text-green-600' />
            Atendimentos de Hoje
          </h3>
          <div className='space-y-3'>
            {todayCompletedAppointments.map((appointment: any) => (
              <div
                key={appointment.id}
                className='flex items-center justify-between p-3 border rounded-lg bg-green-50'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='font-medium text-sm'>
                      {appointment.client.name}
                    </h4>
                    <Badge variant='outline' className='text-xs'>
                      {appointment.scheduledAt
                        ?.toString()
                        .split('T')[1]
                        ?.slice(0, 5) || '00:00'}
                    </Badge>
                  </div>
                  <div className='text-xs text-gray-600'>
                    {appointment.appointmentServices
                      ?.map((as: any) => as.service.name)
                      .join(', ')}
                  </div>
                </div>
                <div className='text-sm font-semibold text-green-600'>
                  {formatCurrency(Number(appointment.total))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4'>
        <div className='bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100'>
          <h3 className='text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
            <CheckCircle className='h-4 w-4 md:h-5 md:w-5 text-green-600' />
            Últimos Atendimentos
          </h3>
          <div>
            {completedAppointments.length > 0 ? (
              <div className='space-y-2'>
                {completedAppointments.slice(0, 3).map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className='flex items-center justify-between p-2 bg-green-50 rounded'>
                    <div className='flex-1'>
                      <div className='font-medium text-sm'>
                        {appointment.client.name}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {appointment.scheduledAt
                          ?.toString()
                          .split('T')[0]
                          ?.split('-')
                          .reverse()
                          .join('/') || ''}
                      </div>
                    </div>
                    <div className='text-sm font-semibold text-green-600'>
                      {formatCurrency(Number(appointment.total))}
                    </div>
                  </div>
                ))}
                <div className='text-center pt-2'>
                  <span className='text-xs text-gray-500'>
                    {completedAppointments.length} atendimentos no período
                  </span>
                </div>
              </div>
            ) : (
              <div className='text-center py-6 text-gray-500'>
                <Activity className='h-8 w-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>Nenhum atendimento no período</p>
              </div>
            )}
          </div>
        </div>

        <div className='bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100'>
          <h3 className='text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
            <Calendar className='h-4 w-4 md:h-5 md:w-5 text-blue-600' />
            Próximos 3 Agendamentos
          </h3>
          <div>
            {scheduledAppointments.length > 0 ? (
              <div className='space-y-2'>
                {scheduledAppointments.slice(0, 3).map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className='flex items-center justify-between p-2 bg-blue-50 rounded'>
                    <div className='flex-1'>
                      <div className='font-medium text-sm'>
                        {appointment.client.name}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {appointment.scheduledAt
                          ?.toString()
                          .split('T')[0]
                          ?.split('-')
                          .reverse()
                          .join('/') || ''}{' '}
                        às{' '}
                        {appointment.scheduledAt
                          ?.toString()
                          .split('T')[1]
                          ?.slice(0, 5) || '00:00'}
                      </div>
                    </div>
                    <div className='text-sm font-semibold text-blue-600'>
                      {formatCurrency(Number(appointment.total))}
                    </div>
                  </div>
                ))}
                <div className='text-center pt-2'>
                  <span className='text-xs text-gray-500'>
                    {scheduledAppointments.length} agendamentos futuros
                  </span>
                </div>
              </div>
            ) : (
              <div className='text-center py-6 text-gray-500'>
                <Calendar className='h-8 w-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>Nenhum agendamento futuro</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100'>
        <h3 className='text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
          <Target className='h-4 w-4 md:h-5 md:w-5' />
          Minha Performance
        </h3>
        <div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {professionalData?.commission?.summary?.totalAppointments || 0}
              </div>
              <div className='text-sm text-muted-foreground'>
                Atendimentos no período
              </div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {professionalData?.commission?.summary?.totalAppointments > 0
                  ? (
                      professionalData.commission.summary.totalRevenue /
                      professionalData.commission.summary.totalAppointments
                    ).toFixed(0)
                  : 0}
              </div>
              <div className='text-sm text-muted-foreground'>
                Ticket médio (R$)
              </div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {professionalData?.commission?.professional?.commissionRate ||
                  0}
                %
              </div>
              <div className='text-sm text-muted-foreground'>
                Taxa de comissão
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showAppointmentForm}
        onOpenChange={(open) => setShowAppointmentForm(open)}>
        <DialogContent className='!w-[95vw] !max-w-[1600px] !h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Agendar Atendimento</DialogTitle>
          </DialogHeader>
          <ScheduledAppointmentForm
            onSuccess={() => setShowAppointmentForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRegisterForm}
        onOpenChange={(open) => setShowRegisterForm(open)}>
        <DialogContent className='!w-[95vw] !max-w-[1600px] !h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Registrar Atendimento</DialogTitle>
          </DialogHeader>
          <ImmediateAppointmentForm
            onSuccess={() => setShowRegisterForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
