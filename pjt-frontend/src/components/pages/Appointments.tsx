import React, { useState, useMemo } from 'react'
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
  Clock,
  Filter,
  X,
  Building2,
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
import { AppointmentStatusManager } from '@/components/custom/appointment/AppointmentStatusManager'
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
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Appointment {
  id: string
  time: string
  client: string
  clientId: string
  service: string
  serviceId: string
  services?: { service: { id: string; name: string; price: string } }[]
  professional: string
  professionalId: string
  duration: number
  endTime: string
  status: 'confirmed' | 'pending' | 'completed' | 'in-progress'
  color: string
  date: string
  scheduledAt: Date
  branchId: string
  price: number
}

interface Professional {
  id: string
  name: string
  avatar: string
}

const getStatusColor = (status: Appointment['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-50 border-green-200 text-green-700'
    case 'confirmed':
      return 'bg-blue-50 border-blue-200 text-blue-700'
    case 'pending':
      return 'bg-yellow-50 border-yellow-200 text-yellow-700'
    case 'in-progress':
      return 'bg-purple-50 border-purple-200 text-purple-700'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700'
  }
}

const getStatusLabel = (status: Appointment['status']) => {
  switch (status) {
    case 'completed':
      return 'Concluído'
    case 'confirmed':
      return 'Confirmado'
    case 'pending':
      return 'Pendente'
    case 'in-progress':
      return 'Em andamento'
    default:
      return status
  }
}

const calculateEndTime = (startTime: string, duration: number): string => {
  if (!startTime || duration === undefined) {
    return startTime
  }
  try {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const startDate = new Date(2000, 0, 1, startHour, startMinute, 0)
    const endDate = new Date(startDate.getTime() + duration * 60000)
    const endHour = endDate.getHours().toString().padStart(2, '0')
    const endMinute = endDate.getMinutes().toString().padStart(2, '0')
    return `${endHour}:${endMinute}`
  } catch (error) {
    const [startHour, startMinute] = (startTime || '00:00')
      .split(':')
      .map(Number)
    const fallbackDate = new Date(2000, 0, 1, startHour, startMinute + 30, 0)
    return `${fallbackDate
      .getHours()
      .toString()
      .padStart(2, '0')}:${fallbackDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }
}

const generateTimeSlots = () => {
  const slots = []
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const time = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`
      slots.push(time)
    }
  }
  return slots
}

const timeSlots = generateTimeSlots()

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export default function Appointments() {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()

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

  const [filterProfessional, setFilterProfessional] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'confirmed' | 'pending' | 'completed' | 'in-progress'
  >('all')
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)

  const { data: appointments = [], isLoading: isLoadingAppointments } =
    useQuery({
      queryKey: ['appointments', activeBranch?.id],
      queryFn: async () => {
        const res = await axios.get('/api/appointments')
        return res.data.map((a: any) => {
          const scheduledDate = new Date(a.scheduledAt)
          const statusMap: Record<
            string,
            'confirmed' | 'pending' | 'completed' | 'in-progress'
          > = {
            CONFIRMED: 'confirmed',
            COMPLETED: 'completed',
            IN_PROGRESS: 'in-progress',
            PENDING: 'pending',
          }

          const time = a.scheduledAt.split('T')[1]?.slice(0, 5) || '00:00'
          const duration = a.appointmentServices?.[0]?.service?.duration ?? 30
          const endTime = calculateEndTime(time, duration)

          const services = a.appointmentServices || []
          const totalPrice = services.reduce((sum, as) => sum + parseFloat(as.service?.price || '0'), 0)
          const totalDuration = services.reduce((sum, as) => sum + (as.service?.duration || 30), 0)
          const serviceNames = services.map(as => as.service?.name).filter(Boolean).join(', ') || 'Serviço'
          const calculatedEndTime = calculateEndTime(time, totalDuration)
          
          return {
            id: a.id,
            clientId: a.client?.id ?? '',
            client: a.client?.name ?? 'Cliente Excluído',
            serviceId: services[0]?.service?.id ?? '',
            service: serviceNames,
            services: services, // Adicionar array completo de serviços
            professionalId: a.professional?.id ?? '',
            professional: a.professional?.name ?? 'Profissional',
            time: time,
            duration: totalDuration,
            endTime: calculatedEndTime,
            status: statusMap[a.status] || 'pending',
            color: 'neutral',
            date: scheduledDate.toISOString().split('T')[0],
            scheduledAt: scheduledDate,
            branchId: a.branchId,
            price: totalPrice || parseFloat(a.total) || 0,
          } as Appointment
        })
      },
      enabled: !!activeBranch,
    })

  const { data: allProfessionals = [], isLoading: isLoadingProfessionals } =
    useQuery({
      queryKey: ['professionals', activeBranch?.id],
      queryFn: async () => {
        if (!activeBranch?.id) {
          return []
        }

        const res = await axios.get(
          `/api/professionals?branchId=${activeBranch.id}`,
        )
        return res.data
          .map((p: any) => {
            const nameParts = p.name?.split(' ') || ['?']
            const avatar = (nameParts[0]?.[0] || '') + (nameParts[1]?.[0] || '')
            return {
              id: p.id,
              name: p.name || 'Profissional',
              avatar: avatar.toUpperCase() || '??',
            } as Professional
          })
          .sort((a, b) => a.name.localeCompare(b.name))
      },
      enabled: !!activeBranch?.id,
    })

  const isLoading = isLoadingAppointments || isLoadingProfessionals

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/appointments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  const branchAppointments = useMemo(
    () => appointments.filter((a) => a.branchId === activeBranch?.id),
    [appointments, activeBranch],
  )

  const filteredProfessionals = useMemo(
    () =>
      filterProfessional === 'all'
        ? allProfessionals
        : allProfessionals.filter((p) => p.id === filterProfessional),
    [allProfessionals, filterProfessional],
  )

  const appointmentsForDay = useMemo(() => {
    const selectedDateKey = selectedDate.toISOString().split('T')[0]
    return branchAppointments.filter((a) => {
      const dateMatch = a.date === selectedDateKey
      const statusMatch = filterStatus === 'all' || a.status === filterStatus
      return dateMatch && statusMatch
    })
  }, [branchAppointments, selectedDate, filterStatus])

  const stats = useMemo(() => {
    const allAppointmentsForDay = branchAppointments.filter(
      (a) => a.date === selectedDate.toISOString().split('T')[0],
    )
    const total = allAppointmentsForDay.length
    const pending = allAppointmentsForDay.filter(
      (a) => a.status === 'pending' || a.status === 'confirmed',
    ).length
    const completed = allAppointmentsForDay.filter(
      (a) => a.status === 'completed',
    ).length
    return { total, pending, completed }
  }, [branchAppointments, selectedDate])

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const formatMonthYear = (date: Date) =>
    date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })

  const goToToday = () => {
    setSelectedDate(normalizeDate(new Date()))
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(normalizeDate(newDate))
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(normalizeDate(newDate))
  }

  return (
    <div className='space-y-4 md:space-y-6'>
      <div className='bg-card rounded-2xl p-3 sm:p-4 shadow-sm border border-border'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2'>
          <div className='text-center sm:text-left'>
            <h2 className='text-xl font-semibold text-foreground'>Agenda</h2>
            <p className='text-sm text-muted-foreground'>
              Gerencie os agendamentos da sua equipe
            </p>
          </div>

          <div className='flex items-center gap-2 p-1 bg-muted rounded-xl flex-shrink-0'>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode !== 'calendar' ? 'cursor-pointer' : ''
              }`}
              style={{
                backgroundColor:
                  viewMode === 'calendar' ? 'var(--color-card)' : 'transparent',
                color:
                  viewMode === 'calendar'
                    ? 'var(--color-primary)'
                    : 'var(--color-muted-foreground)',
                boxShadow:
                  viewMode === 'calendar'
                    ? '0 2px 4px var(--color-shadow)'
                    : 'none',
              }}>
              <CalendarIcon className='w-4 h-4' />
              <span className='hidden sm:inline'>Calendário</span>
            </button>
            <button
              onClick={() => setViewMode('queue')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode !== 'queue' ? 'cursor-pointer' : ''
              }`}
              style={{
                backgroundColor:
                  viewMode === 'queue' ? 'var(--color-card)' : 'transparent',
                color:
                  viewMode === 'queue'
                    ? 'var(--color-primary)'
                    : 'var(--color-muted-foreground)',
                boxShadow:
                  viewMode === 'queue'
                    ? '0 2px 4px var(--color-shadow)'
                    : 'none',
              }}>
              <Users className='w-4 h-4' />
              <span className='hidden sm:inline'>Fila</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'queue' ? (
        <QueueView />
      ) : (
        <div className='space-y-4 md:space-y-6'>
          <div className='bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border'>
            <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
              <div>
                <div className='flex flex-col sm:flex-row sm:items-center gap-3 mb-2'>
                  <h2 className='text-xl sm:text-2xl text-foreground'>
                    Agenda - {formatMonthYear(selectedDate)}
                  </h2>
                  {activeBranch && (
                    <div className='flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-lg'>
                      <Building2 className='w-4 h-4 text-purple-600' />
                      <span className='text-sm text-purple-600'>
                        {activeBranch.name}
                      </span>
                    </div>
                  )}
                </div>
                <p className='text-muted-foreground'>
                  Visualize e gerencie os agendamentos da equipe
                </p>
              </div>

              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
                <Button
                  className='bg-card h-10 border border-purple-300 text-purple-600 py-3 px-4 rounded-xl font-medium hover:border-purple-400 hover:bg-purple-800/5 transition flex items-center justify-center gap-2 cursor-pointer'
                  onClick={() => {
                    setEditingAppointment(null)
                    setShowForm(true)
                  }}>
                  <PlusCircle className='w-4 h-4' /> Agendar Atendimento
                </Button>
                <Button
                  className='bg-card h-10 border border-blue-300 text-blue-600 py-3 px-4 rounded-xl font-medium hover:border-blue-400 hover:bg-blue-800/5 transition flex items-center justify-center gap-2 cursor-pointer'
                  onClick={() => setShowRegisterForm(true)}>
                  <PlusCircle className='w-4 h-4' /> Registrar Atendimento
                </Button>
              </div>
            </div>
          </div>



          <div className='bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border'>
            <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={goToPreviousDay}
                  className='px-3'>
                  <ChevronLeft className='w-4 h-4' />
                  <span className='hidden sm:inline ml-2'>Anterior</span>
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={goToToday}
                  className='min-w-[80px] sm:min-w-[100px]'>
                  Hoje
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={goToNextDay}
                  className='px-3'>
                  <span className='hidden sm:inline mr-2'>Próximo</span>
                  <ChevronRight className='w-4 h-4' />
                </Button>

                <div className='px-3 sm:px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg'>
                  <p className='text-xs sm:text-sm text-purple-900'>
                    {formatDate(selectedDate)}
                  </p>
                </div>
              </div>

              <div className='flex flex-col sm:flex-row items-center gap-2 flex-wrap w-full lg:w-auto'>
                <div className='flex items-center gap-2 w-full sm:w-auto'>
                  <Filter className='w-4 h-4 text-gray-500' />
                  <span className='text-sm text-gray-600'>Filtros:</span>
                </div>

                <select
                  value={filterProfessional}
                  onChange={(e) => setFilterProfessional(e.target.value)}
                  className='w-full sm:w-auto px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500'>
                  <option value='all'>Todos profissionais</option>
                  {allProfessionals.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as typeof filterStatus)
                  }
                  className='w-full sm:w-auto px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500'>
                  <option value='all'>Todos status</option>
                  <option value='confirmed'>Confirmados</option>
                  <option value='pending'>Pendentes</option>
                  <option value='completed'>Concluídos</option>
                  <option value='in-progress'>Em andamento</option>
                </select>
              </div>
            </div>
          </div>

          <div className='bg-card rounded-2xl shadow-sm border border-border overflow-hidden'>
            <div className='overflow-x-auto max-h-[600px] sm:max-h-[700px] overflow-y-auto'>
              <TooltipProvider>
                <div>
                  <div className='sticky top-0 z-20 bg-card border-b border-border shadow-sm'>
                    <div className='flex'>
                      <div className='w-16 flex-shrink-0 p-2 sm:p-3 border-r border-border sticky left-0 bg-card z-30'>
                        <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                          Horário
                        </p>
                      </div>

                      {filteredProfessionals.map((prof) => (
                        <div
                          key={prof.id}
                          className='flex-1 min-w-[160px] sm:min-w-[180px] p-2 sm:p-3 border-r border-border last:border-r-0'>
                          <div className='flex items-center gap-2'>
                            <div className='w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-black flex items-center justify-center text-white flex-shrink-0 text-xs'>
                              {prof.avatar}
                            </div>
                            <div className='min-w-0'>
                              <p className='text-xs text-foreground truncate'>
                                {prof.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='divide-y divide-border/50'>
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className='flex'>
                          <div className='w-16 flex-shrink-0 py-2 px-2 border-r border-border flex items-center justify-center sticky left-0 bg-card z-10'>
                            <Skeleton className='h-4 w-12' />
                          </div>
                          {filteredProfessionals.map((prof) => (
                            <div
                              key={`${i}-${prof.id}`}
                              className='flex-1 min-w-[160px] sm:min-w-[180px] px-2 py-1 border-r border-border last:border-r-0 min-h-[42px] flex items-center'>
                              <Skeleton className='h-6 w-full' />
                            </div>
                          ))}
                        </div>
                      ))
                      : timeSlots.map((time) => (
                        <div
                          key={time}
                          className='flex hover:bg-muted/50 transition-colors'>
                          <div className='w-16 flex-shrink-0 py-2 px-2 border-r border-border flex items-center justify-center sticky left-0 bg-card z-10'>
                            <span className='text-[11px] text-muted-foreground'>
                              {time.endsWith(':00') ? time : ''}
                            </span>
                          </div>

                          {filteredProfessionals.map((prof) => {
                            const appointmentStarting =
                              appointmentsForDay.find(
                                (apt) =>
                                  apt.time === time &&
                                  apt.professionalId === prof.id,
                              )

                            const appointmentCovering =
                              appointmentsForDay.find(
                                (apt) =>
                                  apt.professionalId === prof.id &&
                                  apt.time < time &&
                                  apt.endTime > time,
                              )

                            const rowSpan = appointmentStarting
                              ? Math.ceil(appointmentStarting.duration / 10)
                              : 1

                            const cardHeight = `calc(${
                              rowSpan * 42
                            }px - 0.5rem)`

                            return (
                              <div
                                key={`${time}-${prof.id}`}
                                className='flex-1 min-w-[160px] sm:min-w-[180px] px-2 py-1 border-r border-border last:border-r-0 min-h-[42px] relative'>
                                {appointmentStarting ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`rounded-md border px-2 py-1.5 cursor-pointer transition-all hover:shadow-sm ${getStatusColor(
                                          appointmentStarting.status,
                                        )}`}
                                        style={{
                                          position: 'absolute',
                                          height: cardHeight,
                                          top: '0.25rem',
                                          left: '0.5rem',
                                          width: 'calc(100% - 1rem)',
                                          zIndex: 10,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'space-between',
                                        }}
                                        onClick={() =>
                                          setSelectedAppointment(
                                            appointmentStarting,
                                          )
                                        }>
                                        <div className='flex-1 min-w-0'>
                                          <p className='text-xs truncate'>
                                            {appointmentStarting.client}
                                          </p>
                                          <p className='text-[10px] opacity-75 truncate'>
                                            {appointmentStarting.service}
                                          </p>
                                        </div>
                                        <span className='text-[10px] opacity-60 flex-shrink-0 text-right'>
                                          {getStatusLabel(
                                            appointmentStarting.status,
                                          )}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side='top'
                                      className='max-w-xs'>
                                      <div className='space-y-1 text-xs'>
                                        <p>
                                          <strong>Cliente:</strong>{' '}
                                          {appointmentStarting.client}
                                        </p>
                                        {appointmentStarting.services && appointmentStarting.services.length > 1 ? (
                                          <div>
                                            <strong>Serviços:</strong>
                                            {appointmentStarting.services.map((as, idx) => (
                                              <div key={idx} className='ml-2'>
                                                • {as.service.name} - R$ {parseFloat(as.service.price).toFixed(2)}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p>
                                            <strong>Serviço:</strong>{' '}
                                            {appointmentStarting.service}
                                          </p>
                                        )}
                                        <p>
                                          <strong>Profissional:</strong>{' '}
                                          {appointmentStarting.professional}
                                        </p>
                                        <p>
                                          <strong>Duração:</strong>{' '}
                                          {appointmentStarting.duration}{' '}
                                          minutos
                                        </p>
                                        <p>
                                          <strong>Valor:</strong> R${' '}
                                          {appointmentStarting.price.toFixed(
                                            2,
                                          )}
                                        </p>
                                        <p>
                                          <strong>Status:</strong>{' '}
                                          {getStatusLabel(
                                            appointmentStarting.status,
                                          )}
                                        </p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : appointmentCovering ? (
                                  <></>
                                ) : (
                                  <div className='w-full h-full flex items-center justify-center'>
                                    <span className='text-[10px] text-muted-foreground/30'>
                                      —
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                  </div>
                </div>
              </TooltipProvider>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Total Agendamentos
                  </p>
                  <p className='text-xl sm:text-2xl text-foreground mt-1'>
                    {isLoading ? (
                      <Skeleton className='h-8 w-12' />
                    ) : (
                      stats.total
                    )}
                  </p>
                </div>
                <div className='w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
                  <CalendarIcon className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600' />
                </div>
              </div>
            </div>

            <div className='bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>Pendentes</p>
                  <p className='text-xl sm:text-2xl text-foreground mt-1'>
                    {isLoading ? (
                      <Skeleton className='h-8 w-12' />
                    ) : (
                      stats.pending
                    )}
                  </p>
                </div>
                <div className='w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center'>
                  <Clock className='w-5 h-5 sm:w-6 sm:h-6 text-yellow-600' />
                </div>
              </div>
            </div>

            <div className='bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>Concluídos</p>
                  <p className='text-xl sm:text-2xl text-foreground mt-1'>
                    {isLoading ? (
                      <Skeleton className='h-8 w-12' />
                    ) : (
                      stats.completed
                    )}
                  </p>
                </div>
                <div className='w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center'>
                  <Check className='w-5 h-5 sm:w-6 sm:h-6 text-green-600' />
                </div>
              </div>
            </div>
          </div>

          <div className='bg-card rounded-xl p-3 sm:p-4 shadow-sm border border-border'>
            <div className='flex items-center gap-4 sm:gap-6 flex-wrap'>
              <span className='text-xs text-muted-foreground'>Legenda:</span>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-sm bg-green-50 border border-green-200'></div>
                <span className='text-xs text-muted-foreground'>Concluído</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-sm bg-blue-50 border border-blue-200'></div>
                <span className='text-xs text-muted-foreground'>
                  Confirmado
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-sm bg-yellow-50 border border-yellow-200'></div>
                <span className='text-xs text-muted-foreground'>Pendente</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-sm bg-purple-50 border border-purple-200'></div>
                <span className='text-xs text-muted-foreground'>
                  Em andamento
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) {
            setEditingAppointment(null)
          }
        }}>
        <DialogContent className='!w-[95vw] !max-w-[1600px] !h-auto sm:!h-[90vh] !max-h-[95vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-base sm:text-lg'>
              {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
          </DialogHeader>
          <ScheduledAppointmentForm
            initialData={editingAppointment}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['appointments'] })
              queryClient.invalidateQueries({
                queryKey: ['dashboard-summary'],
              })
              setShowForm(false)
              setEditingAppointment(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRegisterForm}
        onOpenChange={(open) => setShowRegisterForm(open)}>
        <DialogContent className='!w-[95vw] !max-w-[1600px] !h-auto sm:!h-[90vh] !max-h-[95vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Registrar Atendimento</DialogTitle>
          </DialogHeader>
          <ImmediateAppointmentForm
            onSuccess={() => {
              setShowRegisterForm(false)
              queryClient.invalidateQueries({ queryKey: ['appointments'] })
              queryClient.invalidateQueries({
                queryKey: ['dashboard-summary'],
              })
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmingAppointment}
        onOpenChange={() => setConfirmingAppointment(null)}>
        <DialogContent className='!w-[95vw] !max-w-[1600px] !h-auto sm:!h-[90vh] !max-h-[95vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento</DialogTitle>
          </DialogHeader>
          {confirmingAppointment && (
            <AppointmentStatusManager
              appointment={confirmingAppointment}
              onSuccess={() => {
                setConfirmingAppointment(null)
                queryClient.invalidateQueries({ queryKey: ['appointments'] })
                queryClient.invalidateQueries({
                  queryKey: ['dashboard-summary'],
                })
              }}
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

      {selectedAppointment && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-card rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-border'>
            <div className='flex items-start justify-between mb-4'>
              <h3 className='text-lg sm:text-xl text-foreground'>
                Detalhes do Agendamento
              </h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className='text-muted-foreground hover:text-foreground transition-colors'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='text-xs text-muted-foreground uppercase tracking-wider'>
                  Cliente
                </label>
                <p className='text-foreground mt-1'>
                  {selectedAppointment.client}
                </p>
              </div>

              <div>
                <label className='text-xs text-muted-foreground uppercase tracking-wider'>
                  Serviços
                </label>
                {selectedAppointment.services && selectedAppointment.services.length > 1 ? (
                  <div className='mt-1 space-y-1'>
                    {selectedAppointment.services.map((as, index) => (
                      <div key={index} className='flex justify-between text-sm'>
                        <span>• {as.service.name}</span>
                        <span>R$ {parseFloat(as.service.price).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className='border-t pt-1 mt-2 flex justify-between font-semibold'>
                      <span>Total:</span>
                      <span>R$ {selectedAppointment.price.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className='text-foreground mt-1'>
                    {selectedAppointment.service}
                  </p>
                )}
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='text-xs text-muted-foreground uppercase tracking-wider'>
                    Horário
                  </label>
                  <p className='text-foreground mt-1'>
                    {selectedAppointment.time}
                  </p>
                </div>
                <div>
                  <label className='text-xs text-muted-foreground uppercase tracking-wider'>
                    Duração
                  </label>
                  <p className='text-foreground mt-1'>
                    {selectedAppointment.duration} min
                  </p>
                </div>
              </div>

              <div>
                <label className='text-xs text-muted-foreground uppercase tracking-wider'>
                  Profissional
                </label>
                <p className='text-foreground mt-1'>
                  {selectedAppointment.professional}
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='text-xs text-muted-foreground uppercase tracking-wider'>
                    Valor
                  </label>
                  <p className='text-foreground mt-1'>
                    R$ {selectedAppointment.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className='text-xs text-muted-foreground uppercase tracking-wider'>
                    Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs mt-1 ${getStatusColor(
                      selectedAppointment.status,
                    )}`}>
                    {getStatusLabel(selectedAppointment.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => {
                  setEditingAppointment(selectedAppointment)
                  setShowForm(true)
                  setSelectedAppointment(null)
                }}>
                <Edit className='w-4 h-4 mr-2' />
                Editar
              </Button>

              {(() => {
                const appointmentDate = new Date(
                  selectedAppointment.scheduledAt.toISOString().split('T')[0],
                )
                const today = new Date(new Date().toISOString().split('T')[0])
                const canConfirm =
                  appointmentDate <= today &&
                  selectedAppointment.status !== 'completed'

                if (canConfirm) {
                  return (
                    <Button
                      className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                      onClick={() => {
                        setConfirmingAppointment(selectedAppointment)
                        setSelectedAppointment(null)
                      }}>
                      <Check className='w-4 h-4 mr-2' />
                      Confirmar
                    </Button>
                  )
                }
                return (
                  <Button
                    className='flex-1'
                    variant='outline'
                    disabled
                    title='Só é possível confirmar no dia agendado'>
                    <Check className='w-4 h-4 mr-2' />
                    Confirmar
                  </Button>
                )
              })()}

              <Button
                variant='destructive'
                className='px-3'
                onClick={() => {
                  setDeletingAppointment(selectedAppointment)
                  setSelectedAppointment(null)
                }}>
                <Trash2 className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}