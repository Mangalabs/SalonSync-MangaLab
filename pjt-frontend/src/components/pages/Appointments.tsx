import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Edit,
  Check,
  Trash2,
  Calendar as CalendarIcon,
  Users,
} from 'lucide-react'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ScheduledAppointmentForm } from '@/components/custom/appointment/ScheduledAppointmentForm'
import { ImmediateAppointmentForm } from '@/components/custom/appointment/ImmediateAppointmentForm'
import { AppointmentConfirmationForm } from '@/components/custom/appointment/AppointmentConfirmationForm'
import { QueueView } from '@/components/custom/appointment/QueueView'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Appointment {
  id: string
  time: string
  client: string
  clientId: string
  service: string
  serviceId: string
  professional: string
  professionalId: string
  duration: number
  status: 'confirmed' | 'pending' | 'completed'
  color: string
  date: string
  scheduledAt: Date
  branchId: string
}

const statusClasses = {
  confirmed: 'border border-border bg-muted text-foreground',
  pending: 'border border-border bg-muted text-muted-foreground',
  completed: 'border border-border bg-muted opacity-70 text-foreground',
}

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export default function Appointments() {
  const { activeBranch } = useBranch()
  const [viewMode, setViewMode] = useState<'calendar' | 'queue'>('calendar')
  const [showForm, setShowForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null)
  const [deletingAppointment, setDeletingAppointment] =
    useState<Appointment | null>(null)
  const [confirmingAppointment, setConfirmingAppointment] =
    useState<Appointment | null>(null)
  const [selectedDate, setSelectedDate] = useState(() =>
    normalizeDate(new Date()),
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'confirmed' | 'pending' | 'completed'
  >('all')
  const [professionalFilter, setProfessionalFilter] = useState('all')

  const queryClient = useQueryClient()

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/appointments')
      return res.data.map((a: any) => {
        const scheduledDate = new Date(a.scheduledAt)
        return {
          id: a.id,
          clientId: a.client?.id ?? '',
          client: a.client?.name ?? 'Cliente Excluído',
          serviceId: a.appointmentServices?.[0]?.service?.id ?? '',
          service: a.appointmentServices?.[0]?.service?.name ?? 'Serviço',
          professionalId: a.professional?.id ?? '',
          professional: a.professional?.name ?? 'Profissional',
          time: a.scheduledAt.split('T')[1]?.slice(0, 5) || '00:00',
          duration: 30,
          status:
            a.status === 'SCHEDULED'
              ? 'confirmed'
              : a.status === 'COMPLETED'
                ? 'completed'
                : 'pending',
          color: 'neutral',
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

  const todayAppointments = branchAppointments
    .filter(
      (a) =>
        a.date === selectedDateKey &&
        a.status !== 'completed' &&
        (professionalFilter === 'all' ||
          a.professional === professionalFilter) &&
        a.client.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())

  const completedAppointmentsToday = branchAppointments.filter(
    (a) => a.date === selectedDateKey && a.status === 'completed',
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

  const upcomingAppointments = branchAppointments
    .filter((a) => a.status !== 'completed' && a.scheduledAt > new Date())
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(0, 5)



  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/appointments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  return (
    <div className='space-y-6'>
      {/* Toggle de Visualização */}
      <div className='bg-card rounded-2xl p-4 shadow-sm border border-border'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-foreground'>Agenda</h2>
            <p className='text-sm text-muted-foreground'>Gerencie os agendamentos da sua equipe</p>
          </div>
          
          <div className='flex items-center gap-2 p-1 bg-muted rounded-xl'>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode !== 'calendar' ? 'cursor-pointer' : ''
              }`}
              style={{
                backgroundColor: viewMode === 'calendar' ? 'var(--color-card)' : 'transparent',
                color: viewMode === 'calendar' ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                boxShadow: viewMode === 'calendar' ? '0 2px 4px var(--color-shadow)' : 'none',
              }}>
              <CalendarIcon className='w-4 h-4' />
              Calendário
            </button>
            <button
              onClick={() => setViewMode('queue')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode !== 'queue' ? 'cursor-pointer' : ''
              }`}
              style={{
                backgroundColor: viewMode === 'queue' ? 'var(--color-card)' : 'transparent',
                color: viewMode === 'queue' ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                boxShadow: viewMode === 'queue' ? '0 2px 4px var(--color-shadow)' : 'none',
              }}>
              <Users className='w-4 h-4' />
              Fila
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'queue' ? (
        <QueueView />
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          <div className='lg:col-span-3 bg-card rounded-2xl p-6 shadow-sm border border-border'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-lg font-semibold text-foreground capitalize'>
            Agenda - {monthYear} {activeBranch ? `(${activeBranch.name})` : ''}
              </h3>
              <div className='flex space-x-2'>
                <button
                  className='px-4 py-2 bg-button-bg text-button-text rounded-xl font-medium hover:bg-button-hover transition-colors flex items-center gap-2 cursor-pointer'
                  onClick={() =>
                    setSelectedDate(
                      new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth() - 1,
                        1,
                      ),
                    )
                  }>
                  <ChevronLeft className='w-4 h-4' /> Anterior
                </button>
                <button
                  className='px-4 py-2 bg-button-bg text-button-text rounded-xl font-medium hover:bg-button-hover transition-colors flex items-center gap-2 cursor-pointer'
                  onClick={() =>
                    setSelectedDate(
                      new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth() + 1,
                        1,
                      ),
                    )
                  }>
              Próximo <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            </div>

            <div className='mb-8'>
              <div className='grid grid-cols-7 gap-1 mb-4'>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div
                    key={day}
                    className='text-center py-2 text-sm font-semibold text-muted-foreground'>
                    {day}
                  </div>
                ))}
              </div>
              <div className='grid grid-cols-7 gap-1'>
                {calendarDays.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === selectedDate.getMonth()
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isSelected =
                date.toDateString() === selectedDate.toDateString()
                  const dateKey = date.toISOString().split('T')[0]
                  const hasAppointments = branchAppointments.some(
                    (a) => a.date === dateKey && a.status !== 'completed',
                  )

                  return (
                    <div
                      key={index}
                      className={`relative h-16 border border-border rounded-lg p-2 cursor-pointer transition-all ${
                        !isCurrentMonth
                          ? 'bg-muted text-muted-foreground'
                          : isToday
                            ? 'bg-accent/50 border-accent'
                            : isSelected
                              ? 'bg-secondary border-secondary'
                              : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedDate(normalizeDate(date))}>
                      <div
                        className='text-sm font-medium'
                        style={{
                          color: isCurrentMonth
                            ? 'var(--color-text)'
                            : 'var(--color-text-secondary)',
                        }}>
                        {date.getDate()}
                      </div>
                      {hasAppointments && isCurrentMonth && (
                        <div className='mt-1'>
                          <div className='w-2 h-2 bg-foreground rounded-full'></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className='font-semibold text-foreground mb-4 capitalize'>
                {formatDate(selectedDate)}
              </h4>
              <div className='space-y-3'>
                {isLoading && (
                  <div className='space-y-3'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-4 border rounded-xl'>
                        <div className='flex items-center space-x-4'>
                          <div className='text-center min-w-[60px] space-y-1'>
                            <Skeleton className='h-4 w-12 mx-auto' />
                            <Skeleton className='h-3 w-8 mx-auto' />
                          </div>
                          <div className='w-px h-10 bg-card'></div>
                          <div className='space-y-2'>
                            <Skeleton className='h-4 w-32' />
                            <Skeleton className='h-3 w-24' />
                            <Skeleton className='h-3 w-20' />
                          </div>
                        </div>
                        <div className='flex space-x-2'>
                          <Skeleton className='h-8 w-8' />
                          <Skeleton className='h-8 w-8' />
                          <Skeleton className='h-8 w-8' />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!isLoading &&
              todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    statusClasses[appointment.status]
                  }`}>
                  <div className='flex items-center space-x-4'>
                    <div className='text-center min-w-[60px]'>
                      <p className='text-sm font-medium'>{appointment.time}</p>
                      <p className='text-xs opacity-80'>
                        {appointment.duration}min
                      </p>
                    </div>
                    <div className='w-px h-10 bg-current opacity-30'></div>
                    <div>
                      <p className='font-semibold'>{appointment.client}</p>
                      <p className='text-sm text-muted-foreground'>
                        {appointment.service}
                      </p>
                      <p className='text-xs opacity-80'>
                        {appointment.professional}
                      </p>
                    </div>
                  </div>
                  <div className='flex space-x-2'>
                    <button
                      className='p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer'
                      onClick={() => {
                        setEditingAppointment(appointment)
                        setShowForm(true)
                      }}>
                      <Edit className='w-4 h-4' />
                    </button>
                    {(() => {
                      const appointmentDate = new Date(appointment.scheduledAt.toISOString().split('T')[0])
                      const today = new Date(new Date().toISOString().split('T')[0])
                      const canConfirm = appointmentDate <= today
                      
                      if (canConfirm) {
                        return (
                          <button
                            className='p-2 text-green-600 hover:bg-green-200 rounded-lg transition-colors cursor-pointer'
                            onClick={() => setConfirmingAppointment(appointment)}>
                            <Check className='w-4 h-4' />
                          </button>
                        )
                      }
                      
                      return (
                        <div className='relative group'>
                          <button
                            className='p-2 text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed'
                            disabled>
                            <Check className='w-4 h-4' />
                          </button>
                          <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded border border-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10'>
                            ⏰ Só é possível confirmar no dia agendado
                          </div>
                        </div>
                      )
                    })()}
                    <button
                      className='p-2 text-red-600 hover:bg-red-200 rounded-lg transition-colors cursor-pointer'
                      onClick={() => setDeletingAppointment(appointment)}>
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              ))}
                {!isLoading && todayAppointments.length === 0 && (
                  <div className='text-center py-12'>
                    <CalendarIcon className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
                    <h3 className='text-lg font-medium mb-2'>
                  Nenhum agendamento para hoje
                    </h3>
                    <p className='text-muted-foreground'>
                  Que tal agendar o primeiro atendimento do dia?
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
              <h4 className='font-semibold text-foreground mb-4'>
            Novo Atendimento
              </h4>
              <div className='space-y-4'>
                <button
                  className='w-full bg-card border border-purple-300 text-purple-600 py-3 px-4 rounded-xl font-medium hover:border-purple-400 hover:bg-purple-800/5 transition flex items-center justify-center gap-2 cursor-pointer'
                  onClick={() => {
                    setEditingAppointment(null)
                    setShowForm(true)
                  }}>
                  <PlusCircle className='w-4 h-4' /> Agendar Atendimento
                </button>
                <button
                  className='w-full bg-card border border-blue-300 text-blue-600 py-3 px-4 rounded-xl font-medium hover:border-blue-400 hover:bg-blue-800/5 transition flex items-center justify-center gap-2 cursor-pointer'
                  onClick={() => setShowRegisterForm(true)}>
                  <PlusCircle className='w-4 h-4' /> Registrar Atendimento
                </button>
              </div>
            </div>

            <div className='bg-card rounded-2xl p-3 md:p-4 shadow-sm border border-theme'>
              <h4 className='font-semibold text-gray-800 mb-4'>Hoje</h4>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='flex justify-between text-sm'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-4 w-8' />
                    </div>
                  ))}
                </div>
              ) : (
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Total Agendamentos:</span>
                    <span className='font-semibold'>
                      {todayAppointments.length}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Pendentes:</span>
                    <span className='font-semibold text-green-600'>
                      {
                        todayAppointments.filter((a) => a.status === 'confirmed')
                          .length
                      }
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Concluídos:</span>
                    <span className='font-semibold text-blue-600'>
                      {completedAppointmentsToday.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className='bg-card rounded-2xl p-3 md:p-4 shadow-sm border border-theme'>
              <h4 className='font-semibold text-gray-800 mb-4'>Próximos</h4>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className='flex flex-col items-center p-3 md:p-4 rounded-lg border-2 border-dashed border-theme'>
                      <Skeleton className='w-2 h-2 rounded-full' />
                      <div className='flex-1 space-y-1'>
                        <Skeleton className='h-4 w-24' />
                        <Skeleton className='h-3 w-32' />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='space-y-3'>
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
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
              )}
            </div>
          </div>

          <Dialog
            open={showForm}
            onOpenChange={(open) => {
              setShowForm(open)
              if (!open) {
                setEditingAppointment(null)
              }
            }}>
            <DialogContent className='!w-[95vw] !max-w-[1600px] !h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle className='text-base sm:text-lg'>
                  {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                </DialogTitle>
              </DialogHeader>
              <ScheduledAppointmentForm
                initialData={editingAppointment}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['appointments'] })
                  queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
                  setShowForm(false)
                  setEditingAppointment(null)
                }}
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

          <Dialog
            open={!!confirmingAppointment}
            onOpenChange={() => setConfirmingAppointment(null)}>
            <DialogContent className='!w-[95vw] !max-w-[1600px] !h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Confirmar Agendamento</DialogTitle>
              </DialogHeader>
              {confirmingAppointment && (
                <AppointmentConfirmationForm
                  appointment={confirmingAppointment}
                  onSuccess={() => setConfirmingAppointment(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={!!deletingAppointment}
            onOpenChange={() => setDeletingAppointment(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
              Tem certeza que deseja excluir este atendimento? Esta ação não
              pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (deletingAppointment) {
                      deleteAppointment.mutate(deletingAppointment.id)
                      setDeletingAppointment(null)
                    }
                  }}
                  disabled={deleteAppointment.isLoading}>
              Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
