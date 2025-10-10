import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusCircle,
  Calendar,
  ShoppingBag,
  UserPlus,
  DollarSign,
  Scissors,
  Users,
  RefreshCw,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductSaleForm } from '@/components/custom/products/ProductSaleForm'
import { ScheduledAppointmentForm } from '@/components/custom/appointment/ScheduledAppointmentForm'
import { ImmediateAppointmentForm } from '@/components/custom/appointment/ImmediateAppointmentForm'

import { StatsCard } from '../ui/stats-card'

const formatDate = (d: Date) => d.toLocaleDateString('sv')
const formatCurrency = (v: number) => `R$ ${v.toFixed(2)}`

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { activeBranch } = useBranch()
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const queryClient = useQueryClient()

  const fixHistoricalMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/appointments/fix-historical')
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['financial'] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erro ao corrigir dados históricos',
      )
    },
  })

  const today = new Date()
  const todayStr = formatDate(today)
  const yesterdayStr = formatDate(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
  )

  const { startDate, endDate } = useMemo(() => {
    const firstDayOfWeek = new Date(today)
    firstDayOfWeek.setDate(today.getDate() - today.getDay())
    return { startDate: formatDate(firstDayOfWeek), endDate: todayStr }
  }, [todayStr, today])

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-summary', startDate, endDate, activeBranch?.id],
    queryFn: async () => {
      if (!activeBranch?.id) {
        return null
      }
      const params = new URLSearchParams({
        startDate,
        endDate,
        branchId: activeBranch.id,
      })
      const [financial, appointments, professionals, clients, movements] =
        await Promise.all([
          axios.get(`/api/financial/summary?${params}`),
          axios.get(`/api/appointments?${params}`),
          axios.get(`/api/professionals?${params}`),
          axios.get(`/api/clients?${params}`),
          axios.get(`/api/inventory/movements?${params}`),
        ])
      return {
        financial: financial.data,
        appointments: appointments.data,
        professionals: professionals.data,
        clients: clients.data,
        movements: movements.data,
      }
    },
    enabled: !!activeBranch,
  })

  const branchId = String(activeBranch?.id)
  const appointments = useMemo(
    () =>
      dashboardData?.appointments?.filter(
        (a) => String(a.branchId) === branchId,
      ) || [],
    [dashboardData, branchId],
  )
  const movements = useMemo(
    () =>
      dashboardData?.movements?.filter(
        (m) => String(m.branchId) === branchId,
      ) || [],
    [dashboardData, branchId],
  )

  const revenueForDate = (date: string) =>
    appointments
      .filter((a) => formatDate(new Date(a.scheduledAt)) === date && a.status === 'COMPLETED')
      .reduce((s, a) => s + +a.total, 0) +
    movements
      .filter((m) => formatDate(new Date(m.createdAt)) === date)
      .reduce((s, m) => s + +m.totalCost, 0)

  const todayRevenue = revenueForDate(todayStr)
  const yesterdayRevenue = revenueForDate(yesterdayStr)

  const filterByDate = (arr: any[], field: string, date: string) =>
    arr.filter((i) => formatDate(new Date(i[field])) === date)
  const todayAppointments = filterByDate(appointments, 'scheduledAt', todayStr)
  const yesterdayAppointments = filterByDate(
    appointments,
    'scheduledAt',
    yesterdayStr,
  )
  const todayCompleted = todayAppointments.filter(
    (a) => a.status === 'COMPLETED',
  )
  const yesterdayCompleted = yesterdayAppointments.filter(
    (a) => a.status === 'COMPLETED',
  )

  const weeklyRevenueData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - d.getDay() + i)
      return formatDate(d)
    })
    const totals = Object.fromEntries(days.map((d) => [d, 0]))

    appointments.forEach((a) => {
      const d = formatDate(new Date(a.scheduledAt))
      if (totals[d] !== undefined && a.status === 'COMPLETED') {
        totals[d] += +a.total
      }
    })
    movements.forEach((m) => {
      const d = formatDate(new Date(m.createdAt))
      if (totals[d] !== undefined) {
        totals[d] += +m.totalCost
      }
    })

    return days.map((d) => ({
      name: new Date(d).toLocaleDateString('pt-BR', { weekday: 'short' }),
      value: totals[d],
      isToday: d === todayStr,
    }))
  }, [appointments, movements, today, todayStr])

  const servicesData = useMemo(() => {
    const acc: { name: string; value: number; color: string }[] = []
    appointments.forEach((a) =>
      a.appointmentServices?.forEach((s: any) => {
        const name = s.service?.name || 'Desconhecido'
        const item = acc.find((i) => i.name === name)
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        item
          ? item.value++
          : acc.push({
            name,
            value: 1,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          })
      }),
    )
    return acc
  }, [appointments])

  const totalClients = dashboardData?.clients?.length || 0
  const thisWeekClients =
    dashboardData?.clients?.filter(
      (c: any) => new Date(c.createdAt) >= new Date(startDate),
    ) || []
  const lastWeekStart = new Date(startDate)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(startDate)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
  const lastWeekClients =
    dashboardData?.clients?.filter(
      (c: any) =>
        new Date(c.createdAt) >= lastWeekStart &&
        new Date(c.createdAt) <= lastWeekEnd,
    ) || []
  const diffClients = thisWeekClients.length - lastWeekClients.length
  const clientsChangeText =
    diffClients > 0
      ? `+${diffClients} novos esta semana`
      : diffClients < 0
        ? `${diffClients} novos esta semana`
        : 'sem variação'

  const now = new Date(),
    twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const nextAppointments = todayAppointments.filter(
    (a) => new Date(a.scheduledAt) > now && a.status !== 'COMPLETED',
  )
  const nextTwoHours = nextAppointments.filter(
    (a) => new Date(a.scheduledAt) <= twoHoursLater,
  )

  const revenuePercent = yesterdayRevenue
    ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(0)
    : '0'
  const appointmentsPercent = yesterdayCompleted.length
    ? (
      ((todayCompleted.length - yesterdayCompleted.length) /
        yesterdayCompleted.length) *
      100
    ).toFixed(0)
    : '0'

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
      id: 'sell-product',
      icon: ShoppingBag,
      label: 'Vender Produto',
      route: '/dashboard/sales',
      color: 'green',
    },
    {
      id: 'clients',
      icon: UserPlus,
      label: 'Novo Cliente',
      route: '/dashboard/clients',
      color: 'orange',
    },
  ]

  const actionColors: Record<string, string> = {
    purple:
      'border-purple-300 hover:border-purple-400 hover:bg-purple-800/5 text-purple-600',
    blue: 'border-blue-300 hover:border-blue-400 hover:bg-blue-800/5  text-blue-600',
    green:
      'border-green-300 hover:border-green-400 hover:bg-green-800/5  text-green-600',
    orange:
      'border-orange-300 hover:border-orange-400 hover:bg-orange-800/5  text-orange-600',
  }

  if (isLoading) {
    return (
      <div className='space-y-4 md:space-y-6'>
        <div className='bg-card rounded-2xl p-3 md:p-4 shadow-sm border border-theme'>
          <div className='flex justify-between items-center mb-3 md:mb-4'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-8 w-28' />
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='flex flex-col items-center p-3 md:p-4 rounded-lg border-2 border-dashed border-theme'>
                <Skeleton className='w-6 h-6 mb-2' />
                <Skeleton className='h-4 w-20' />
              </div>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className='bg-card rounded-2xl p-4 shadow-sm border border-theme'>
              <div className='flex items-center justify-between mb-3'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-6 w-16' />
                </div>
                <Skeleton className='w-10 h-10 rounded-full' />
              </div>
              <Skeleton className='h-3 w-20' />
            </div>
          ))}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4'>
          <div className='bg-card rounded-2xl p-3 md:p-4 shadow-sm border border-theme'>
            <Skeleton className='h-5 w-40 mb-4' />
            <Skeleton className='h-48 md:h-56 lg:h-67 w-full' />
          </div>
          <div className='bg-card rounded-2xl p-3 md:p-4 shadow-sm border border-theme'>
            <Skeleton className='h-5 w-40 mb-4' />
            <Skeleton className='h-48 md:h-56 lg:h-67 w-full' />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className='space-y-4 md:space-y-6'
      style={{
        backgroundColor: 'var(--color-background)',
        minHeight: '80vh',
        padding: '1rem',
      }}>
      <div
        className='rounded-2xl p-3 md:p-4 shadow-sm border'
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}>
        <div className='flex justify-between items-center mb-3 md:mb-4'>
          <h3 style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Ações Rápidas
          </h3>
          <button
            onClick={() => fixHistoricalMutation.mutate()}
            disabled={fixHistoricalMutation.isPending}
            className='flex items-center gap-1 px-2 py-1 text-xs rounded'
            style={{
              backgroundColor: 'var(--color-button-bg)',
              color: 'var(--color-button-text)',
            }}>
            <RefreshCw
              className={`h-3 w-3 ${
                fixHistoricalMutation.isPending ? 'animate-spin' : ''
              }`}
            />
            Corrigir Histórico
          </button>
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
                }
                // eslint-disable-next-line no-dupe-else-if
                else if (a.openForm) {
                  setShowSaleForm(true)
                } else if (a.route) {
                  navigate(a.route)
                }
              }}
              className={`flex flex-col items-center p-3 md:p-4 rounded-lg cursor-pointer border-2 border-dashed transition-all hover:shadow-md ${
                actionColors[a.color]
              }`}>
              <a.icon className='w-5 h-8 md:w-6 md:h-18 mb-1 md:mb-2' />
              <span className='text-xs md:text-sm font-medium text-center'>
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
        <StatsCard
          title='Faturamento Hoje'
          value={formatCurrency(todayRevenue)}
          change={`${revenuePercent}% vs ontem`}
          changeType={+revenuePercent >= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
          iconColor='green'
        />
        <StatsCard
          title='Atendimentos Concluidos Hoje'
          value={todayCompleted.length.toString()}
          change={`${appointmentsPercent}% vs ontem`}
          changeType={+appointmentsPercent >= 0 ? 'positive' : 'negative'}
          icon={Scissors}
          iconColor='blue'
        />
        <StatsCard
          title='Clientes Ativos'
          value={totalClients}
          change={clientsChangeText}
          changeType={diffClients >= 0 ? 'positive' : 'negative'}
          icon={Users}
          iconColor='purple'
        />
        <StatsCard
          title='Atendimentos Pendentes Hoje'
          value={nextAppointments.length.toString()}
          change={`Próximas 2h: ${nextTwoHours.length}`}
          changeType='neutral'
          icon={Calendar}
          iconColor='orange'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4'>
        <div
          className='rounded-2xl p-3 md:p-4 shadow-sm border'
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}>
          <h3
            style={{
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}>
            Faturamento Semanal
          </h3>
          <div className='h-48 md:h-56 lg:h-67'>
            <ResponsiveContainer>
              <LineChart data={weeklyRevenueData}>
                <XAxis
                  dataKey='name'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#888888' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#888888' }}
                />
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke='#8B5CF6'
                  strokeWidth={2.5}
                  dot={({ cx, cy, payload }) => (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={payload.isToday ? 5 : 2.5}
                      fill={payload.isToday ? '#281CF1' : '#8B5CF6'}
                    />
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className='rounded-2xl p-3 md:p-4 shadow-sm border'
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}>
          <h3
            style={{
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}>
            Serviços Mais Populares
          </h3>
          <div className='h-48 md:h-56 lg:h-67'>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={servicesData}
                  cx='50%'
                  cy='50%'
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey='value'>
                  {servicesData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => {
                    const total = servicesData.reduce((s, x) => s + x.value, 0)
                    const pct = total ? ((+v / total) * 100).toFixed(2) : '0.00'
                    return [`${pct}%`, n]
                  }}
                />
                <Legend verticalAlign='bottom' height={28} iconType='circle' />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Venda de Produto</DialogTitle>
          </DialogHeader>
          <ProductSaleForm onSuccess={() => setShowSaleForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAppointmentForm}
        onOpenChange={(open) => {
          setShowAppointmentForm(open)
          setEditingAppointment(null)
        }}>
        <DialogContent className='!w-[95vw] !max-w-[1600px] !h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Agendar Atendimento</DialogTitle>
          </DialogHeader>
          <ScheduledAppointmentForm
            initialData={editingAppointment}
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
