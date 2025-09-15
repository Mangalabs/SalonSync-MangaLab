import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Edit,
  Check,
  Calendar as CalendarIcon,
} from 'lucide-react'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppointmentForm } from '@/components/custom/appointment/AppointmentForm'

interface Appointment {
  id: string
  time: string
  client: string
  service: string
  professional: string
  duration: number
  status: 'confirmed' | 'pending' | 'completed'
  color: string
  date: string
  scheduledAt: Date
  branchId: string
}

const colorClasses = {
  green: 'border-green-200 bg-green-50 text-green-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  purple: 'border-purple-200 bg-purple-50 text-purple-700',
  orange: 'border-orange-200 bg-orange-50 text-orange-700',
}

const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export default function Appointments() {
  const { activeBranch } = useBranch()
  const [showForm, setShowForm] = useState(false)

  const [selectedDate, setSelectedDate] = useState(() =>
    normalizeDate(new Date()),
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'confirmed' | 'pending' | 'completed'
  >('all')
  const [professionalFilter, setProfessionalFilter] = useState('all')

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/appointments', {
        params: { branchId: activeBranch?.id },
      })

      return res.data.map((a: any) => {
        const scheduledDate = new Date(a.scheduledAt)
        return {
          id: a.id,
          time: scheduledDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          client: a.client?.name ?? 'Cliente',
          service: a.appointmentServices?.[0]?.service?.name ?? 'Serviço',
          professional: a.professional?.name ?? 'Profissional',
          duration: 30,
          status: a.status === 'SCHEDULED' ? 'confirmed' : 'pending',
          color: 'purple',
          date: scheduledDate.toISOString().split('T')[0],
          scheduledAt: scheduledDate,
          branchId: a.branchId,
        } as Appointment
      })
    },
    enabled: !!activeBranch,
  })

  const branchAppointments = appointments.filter(
    (a) => a.branchId === activeBranch?.id,
  )

  const selectedDateKey = selectedDate.toISOString().split('T')[0]
  const todayAppointments = branchAppointments.filter(
    (a) =>
      a.date === selectedDateKey &&
      (statusFilter === 'all' || a.status === statusFilter) &&
      (professionalFilter === 'all' || a.professional === professionalFilter) &&
      a.client.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }

  const calendarDays = generateCalendarDays()
  const monthYear = selectedDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const upcomingAppointments = [...branchAppointments]
    .filter((a) => a.scheduledAt > new Date())
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(0, 5)

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 capitalize'>
            Agenda - {monthYear} {activeBranch ? `(${activeBranch.name})` : ''}
          </h3>
          <div className='flex space-x-2'>
            <button
              className='px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors flex items-center gap-2'
              onClick={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() - 1,
                    1,
                  ),
                )
              }
            >
              <ChevronLeft className='w-4 h-4' /> Anterior
            </button>
            <button
              className='px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors flex items-center gap-2'
              onClick={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1,
                    1,
                  ),
                )
              }
            >
              Próximo <ChevronRight className='w-4 h-4' />
            </button>
          </div>
        </div>

        <div className='mb-8'>
          <div className='grid grid-cols-7 gap-1 mb-4'>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div
                key={day}
                className='text-center py-2 text-sm font-semibold text-gray-600'
              >
                {day}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-7 gap-1'>
            {calendarDays.map((date, index) => {
              const isCurrentMonth =
                date.getMonth() === selectedDate.getMonth()
              const isToday = date.toDateString() === new Date().toDateString()
              const isSelected =
                date.toDateString() === selectedDate.toDateString()
              const dateKey = date.toISOString().split('T')[0]
              const hasAppointments = branchAppointments.some(
                (a) => a.date === dateKey,
              )

              return (
                <div
                  key={index}
                  className={`relative h-16 border border-gray-100 rounded-lg p-2 cursor-pointer transition-all ${
                    !isCurrentMonth
                      ? 'text-gray-300 bg-gray-50'
                      : isToday
                        ? 'bg-purple-100 border-purple-300'
                        : isSelected
                          ? 'bg-purple-200 border-purple-400'
                          : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDate(normalizeDate(date))}
                >
                  <div
                    className={`text-sm font-medium ${
                      isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  {hasAppointments && isCurrentMonth && (
                    <div className='mt-1'>
                      <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h4 className='font-semibold text-gray-800 mb-4 capitalize'>
            {formatDate(selectedDate)}
          </h4>
          <div className='space-y-3'>
            {isLoading && (
              <p className='text-gray-500'>Carregando agendamentos...</p>
            )}
            {!isLoading &&
              todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`flex items-center justify-between p-4 border rounded-xl ${
                    colorClasses[appointment.color as keyof typeof colorClasses]
                  }`}
                >
                  <div className='flex items-center space-x-4'>
                    <div className='text-center min-w-[60px]'>
                      <p className='text-sm font-medium'>{appointment.time}</p>
                      <p className='text-xs opacity-80'>
                        {appointment.duration}min
                      </p>
                    </div>
                    <div className='w-px h-10 bg-current opacity-30'></div>
                    <div>
                      <p className='font-semibold text-gray-800'>
                        {appointment.client}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {appointment.service}
                      </p>
                      <p className='text-xs opacity-80'>
                        {appointment.professional}
                      </p>
                    </div>
                  </div>
                  <div className='flex space-x-2'>
                    <button className='p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors'>
                      <Edit className='w-4 h-4' />
                    </button>
                    <button className='p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors'>
                      <Check className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              ))}

            {!isLoading && todayAppointments.length === 0 && (
              <div className='text-center py-12'>
                <CalendarIcon className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  Nenhum agendamento para hoje
                </h3>
                <p className='text-gray-500'>
                  Que tal agendar o primeiro atendimento do dia?
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='space-y-6'>
        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <h4 className='font-semibold text-gray-800 mb-4'>Novo Agendamento</h4>
          <button
            className='w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2'
            onClick={() => setShowForm(true)}
          >
            <PlusCircle className='w-4 h-4' /> Agendar Horário
          </button>
        </div>

        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <h4 className='font-semibold text-gray-800 mb-4'>Hoje</h4>
          <div className='space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Total Agendamentos:</span>
              <span className='font-semibold'>{todayAppointments.length}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Confirmados:</span>
              <span className='font-semibold text-green-600'>
                {
                  todayAppointments.filter((a) => a.status === 'confirmed')
                    .length
                }
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Pendentes:</span>
              <span className='font-semibold text-orange-600'>
                {todayAppointments.filter((a) => a.status === 'pending').length}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Taxa Ocupação:</span>
              <span className='font-semibold text-purple-600'>85%</span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <h4 className='font-semibold text-gray-800 mb-4'>Próximos</h4>
          <div className='space-y-3'>
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'
              >
                <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-800'>
                    {appointment.client}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {appointment.date} {appointment.time}
                  </p>
                </div>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <p className='text-sm text-gray-500'>
                Nenhum agendamento futuro.
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-base sm:text-lg'>
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            mode='scheduled'
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
