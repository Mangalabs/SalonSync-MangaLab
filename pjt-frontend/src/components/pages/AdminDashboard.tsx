import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, Scissors, Users, Calendar,
  PlusCircle, ShoppingBag, UserPlus,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProductSaleForm } from '@/components/custom/products/ProductSaleForm'

import { StatsCard } from '../ui/stats-card'

const formatDate = (d: Date) => d.toLocaleDateString('sv')
const formatCurrency = (v: number) => `R$ ${v.toFixed(2)}`

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { activeBranch } = useBranch()
  const [showSaleForm, setShowSaleForm] = useState(false)

  const today = new Date()
  const todayStr = formatDate(today)
  const yesterdayStr = formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))

  const { startDate, endDate } = useMemo(() => {
    const firstDayOfWeek = new Date(today)
    firstDayOfWeek.setDate(today.getDate() - today.getDay())
    return { startDate: formatDate(firstDayOfWeek), endDate: todayStr }
  }, [todayStr, today])

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-summary', startDate, endDate, activeBranch?.id],
    queryFn: async () => {
      if (!activeBranch?.id) {return null}
      const params = new URLSearchParams({ startDate, endDate, branchId: activeBranch.id })
      const [financial, appointments, professionals, clients, movements] = await Promise.all([
        axios.get(`/api/financial/summary?${params}`),
        axios.get(`/api/appointments?${params}`),
        axios.get(`/api/professionals?${params}`),
        axios.get(`/api/clients?${params}`),
        axios.get(`/api/inventory/movements?${params}`),
      ])
      return { financial: financial.data, appointments: appointments.data, professionals: professionals.data, clients: clients.data, movements: movements.data }
    },
    enabled: !!activeBranch,
  })

  const branchId = String(activeBranch?.id)
  const appointments = useMemo(() => dashboardData?.appointments?.filter(a => String(a.branchId) === branchId) || [], [dashboardData, branchId])
  const movements = useMemo(() => dashboardData?.movements?.filter(m => String(m.branchId) === branchId) || [], [dashboardData, branchId])

  const revenueForDate = (date: string) =>
    appointments.filter(a => formatDate(new Date(a.scheduledAt)) === date).reduce((s, a) => s + +a.total, 0) +
    movements.filter(m => formatDate(new Date(m.createdAt)) === date).reduce((s, m) => s + +m.totalCost, 0)

  const todayRevenue = revenueForDate(todayStr)
  const yesterdayRevenue = revenueForDate(yesterdayStr)

  const filterByDate = (arr: any[], field: string, date: string) => arr.filter(i => formatDate(new Date(i[field])) === date)
  const todayAppointments = filterByDate(appointments, 'scheduledAt', todayStr)
  const yesterdayAppointments = filterByDate(appointments, 'scheduledAt', yesterdayStr)

  const todayCompleted = todayAppointments.filter(a => a.status === 'COMPLETED')
  const yesterdayCompleted = yesterdayAppointments.filter(a => a.status === 'COMPLETED')

  const weeklyRevenueData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - d.getDay() + i)
      return formatDate(d)
    })
    const totals = Object.fromEntries(days.map(d => [d, 0]))

    appointments.forEach(a => { const d = formatDate(new Date(a.scheduledAt)); if (totals[d] !== undefined) {totals[d] += +a.total} })
    movements.forEach(m => { const d = formatDate(new Date(m.createdAt)); if (totals[d] !== undefined) {totals[d] += +m.totalCost} })

    return days.map(d => ({ name: new Date(d).toLocaleDateString('pt-BR', { weekday: 'short' }), value: totals[d], isToday: d === todayStr }))
  }, [appointments, movements, today, todayStr])

  const servicesData = useMemo(() => {
    const acc: { name: string; value: number; color: string }[] = []
    appointments.forEach(a => a.appointmentServices?.forEach((s: any) => {
      const name = s.service?.name || 'Desconhecido'
      const item = acc.find(i => i.name === name)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      item ? item.value++ : acc.push({ name, value: 1, color: `#${Math.floor(Math.random() * 16777215).toString(16)}` })
    }))
    return acc
  }, [appointments])

  const totalClients = dashboardData?.clients?.length || 0
  const thisWeekClients = dashboardData?.clients?.filter((c: any) => new Date(c.createdAt) >= new Date(startDate)) || []
  const lastWeekStart = new Date(startDate); lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(startDate); lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
  const lastWeekClients = dashboardData?.clients?.filter((c: any) => new Date(c.createdAt) >= lastWeekStart && new Date(c.createdAt) <= lastWeekEnd) || []
  const diffClients = thisWeekClients.length - lastWeekClients.length
  const clientsChangeText = diffClients > 0 ? `+${diffClients} novos esta semana` : diffClients < 0 ? `${diffClients} novos esta semana` : 'sem variação'

  const now = new Date(), twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const nextAppointments = todayAppointments.filter(a => new Date(a.scheduledAt) > now && a.status !== 'COMPLETED')
  const nextTwoHours = nextAppointments.filter(a => new Date(a.scheduledAt) <= twoHoursLater)

  const revenuePercent = yesterdayRevenue ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(0) : '0'
  const appointmentsPercent = yesterdayCompleted.length ? (((todayCompleted.length - yesterdayCompleted.length) / yesterdayCompleted.length) * 100).toFixed(0) : '0'

  const quickActions = [
    { id: 'new-appointment', icon: PlusCircle, label: 'Novo Atendimento', route: '/dashboard/treatments', color: 'purple' },
    { id: 'appointments', icon: Calendar, label: 'Agendar Horário', route: '/dashboard/appointments', color: 'blue' },
    { id: 'sell-product', icon: ShoppingBag, label: 'Vender Produto', opensSaleForm: true, color: 'green' },
    { id: 'clients', icon: UserPlus, label: 'Novo Cliente', route: '/dashboard/clients', color: 'orange' },
  ]
  const actionColors: Record<string, string> = {
    purple: 'border-purple-300 hover:border-purple-400 hover:bg-purple-50 text-purple-600',
    blue: 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600',
    green: 'border-green-300 hover:border-green-400 hover:bg-green-50 text-green-600',
    orange: 'border-orange-300 hover:border-orange-400 hover:bg-orange-50 text-orange-600',
  }

  if (isLoading) {return <div className="text-center py-20">Carregando dados do dashboard...</div>}

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {quickActions.map(a => (
            <button
              key={a.id}
              onClick={() => a.opensSaleForm ? setShowSaleForm(true) : navigate(a.route!)}
              className={`flex flex-col items-center p-3 md:p-4 rounded-lg border-2 border-dashed transition-all hover:shadow-md ${actionColors[a.color]}`}
            >
              <a.icon className="w-5 h-8 md:w-6 md:h-18 mb-1 md:mb-2" />
              <span className="text-xs md:text-sm font-medium text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard title="Faturamento Hoje" value={formatCurrency(todayRevenue)} change={`${revenuePercent}% vs ontem`} changeType={+revenuePercent >= 0 ? 'positive' : 'negative'} icon={DollarSign} iconColor="green" />
        <StatsCard title="Atendimentos Concluidos Hoje" value={todayCompleted.length.toString()} change={`${appointmentsPercent}% vs ontem`} changeType={+appointmentsPercent >= 0 ? 'positive' : 'negative'} icon={Scissors} iconColor="blue" />
        <StatsCard title="Clientes Ativos" value={totalClients} change={clientsChangeText} changeType={diffClients >= 0 ? 'positive' : 'negative'} icon={Users} iconColor="purple" />
        <StatsCard title="Atendimentos Pendentes Hoje" value={nextAppointments.length.toString()} change={`Próximas 2h: ${nextTwoHours.length}`} changeType="neutral" icon={Calendar} iconColor="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4">Faturamento Semanal</h3>
          <div className="h-48 md:h-56 lg:h-67">
            <ResponsiveContainer>
              <LineChart data={weeklyRevenueData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip formatter={v => formatCurrency(v as number)} />
                <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2.5} dot={({ cx, cy, payload }) => (<circle cx={cx} cy={cy} r={payload.isToday ? 5 : 2.5} fill={payload.isToday ? '#281CF1' : '#8B5CF6'} />)} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4">Serviços Mais Populares</h3>
          <div className="h-48 md:h-56 lg:h-67">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={servicesData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                  {servicesData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => { const total = servicesData.reduce((s, x) => s + x.value, 0); const pct = total ? ((+v / total) * 100).toFixed(2) : '0.00'; return [`${pct}%`, n] }} />
                <Legend verticalAlign="bottom" height={28} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Venda de Produto</DialogTitle></DialogHeader>
          <ProductSaleForm onSuccess={() => setShowSaleForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
