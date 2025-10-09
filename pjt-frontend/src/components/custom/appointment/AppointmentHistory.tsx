import React, { useState } from 'react'
import { Trophy, Edit, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ImmediateAppointmentForm } from '@/components/custom/appointment/ImmediateAppointmentForm'

interface Appointment {
  id: string
  scheduledAt: string | Date | null
  status?: string
  professional: { name: string } | null
  client: { name: string } | null
  appointmentServices?: {
    service: { name: string; price: string }
  }[]
  total?: string
  rating?: number
  branchId?: string
}

interface AppointmentHistory {
  id: string
  date: string
  time: string
  client: string
  services: string[]
  professional: string
  duration: number
  price: number
  status?: string
  rating?: number
}

export default function AppointmentHistory() {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()

  const [filterProfessional, setFilterProfessional] = useState<string>('all')
  const [filterService, setFilterService] = useState<string>('all')
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/appointments')
      return res.data
    },
    enabled: !!activeBranch,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/appointments/${id}`)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })

  if (isLoading) {return <div className='p-6'>Carregando histórico...</div>}

  const branchAppointments = appointments.filter(
    (apt) =>
      apt &&
      apt.status &&
      apt.status.toUpperCase() !== 'SCHEDULED' &&
      apt.branchId === activeBranch?.id,
  )

  const normalizedAppointments: AppointmentHistory[] = branchAppointments.map(
    (apt) => {
      console.log('Appointment data:', apt)
      const dateObj = apt.scheduledAt ? new Date(apt.scheduledAt) : null
      const scheduledAtStr = typeof apt.scheduledAt === 'string' ? apt.scheduledAt : apt.scheduledAt?.toString() || ''
      const dateStr = dateObj && scheduledAtStr ? scheduledAtStr.split('T')[0] : ''
      const timeStr = dateObj && scheduledAtStr ? scheduledAtStr.split('T')[1]?.slice(0, 5) || '' : ''

      const serviceNames = Array.isArray(apt.appointmentServices)
        ? apt.appointmentServices.map((s) => s.service.name)
        : []

      return {
        id: apt.id,
        date: dateStr,
        time: timeStr,
        client: apt.client?.name || 'Cliente removido',
        services: serviceNames,
        professional: apt.professional?.name || 'Profissional removido',
        duration: 45,
        price: Number(apt.total) || 0,
        paymentMethod: apt.paymentMethod || 'N/A',
        status:
          apt.status === 'COMPLETED'
            ? 'completed'
            : apt.status === 'CANCELLED'
              ? 'cancelled'
              : 'no-show',
        rating: apt.rating || undefined,
      }
    },
  )

  const professionals = Array.from(
    new Set(normalizedAppointments.map((a) => a.professional)),
  )
  const services = Array.from(
    new Set(normalizedAppointments.flatMap((a) => a.services)),
  )

  const filteredHistory = normalizedAppointments.filter((appointment) => {
    if (
      filterProfessional !== 'all' &&
      appointment.professional !== filterProfessional
    )
    {return false}
    if (
      filterService !== 'all' &&
      !appointment.services.includes(filterService)
    )
    {return false}
    if (filterStartDate && appointment.date < filterStartDate) {return false}
    if (filterEndDate && appointment.date > filterEndDate) {return false}
    return true
  })

  const professionalStats = normalizedAppointments.reduce(
    (acc, appointment) => {
      if (!acc[appointment.professional])
      {acc[appointment.professional] = {
        name: appointment.professional,
        appointments: 0,
        revenue: 0,
        ratings: [] as number[],
      }}
      if (appointment.status === 'completed') {
        acc[appointment.professional].appointments++
        acc[appointment.professional].revenue += appointment.price
        if (appointment.rating)
        {acc[appointment.professional].ratings.push(appointment.rating)}
      }
      return acc
    },
    {} as Record<string, any>,
  )
  const topProfessional = Object.values(professionalStats).sort(
    (a, b) => b.appointments - a.appointments,
  )[0]

  const [editingAppointment, setEditingAppointment] =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useState<AppointmentHistory | null>(null)
  const [deletingAppointment, setDeletingAppointment] =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useState<AppointmentHistory | null>(null)

  return (
    <div className='space-y-6 p-6'>
      <div className='bg-muted p-4 rounded-2xl border border-border flex flex-wrap gap-4 items-end'>
        {[
          { label: 'Profissional', value: filterProfessional, onChange: setFilterProfessional, options: ['all', ...professionals] },
          { label: 'Serviço', value: filterService, onChange: setFilterService, options: ['all', ...services] },
        ].map(({ label, value, onChange, options }) => (
          <div key={label} className='flex flex-col'>
            <label className='text-muted-foreground text-sm mb-1'>{label}</label>
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className='px-3 py-2 border border-border rounded-lg bg-card text-card-foreground focus:ring-2 focus:ring-ring'
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}

        {['Data Início', 'Data Fim'].map((label, idx) => (
          <div key={label} className='flex flex-col'>
            <label className='text-muted-foreground text-sm mb-1'>{label}</label>
            <input
              type='date'
              value={idx === 0 ? filterStartDate : filterEndDate}
              onChange={(e) => idx === 0 ? setFilterStartDate(e.target.value) : setFilterEndDate(e.target.value)}
              className='px-3 py-2 border border-border rounded-lg bg-card text-card-foreground focus:ring-2 focus:ring-ring'
            />
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-sm'>
          <h3 className='text-lg font-semibold text-foreground mb-4'>Histórico de Atendimentos</h3>
          <div className={`overflow-x-auto ${filteredHistory.length > 7 ? 'overflow-y-scroll max-h-[500px]' : ''}`}>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-border'>
                  {['Data','Cliente','Serviços','Profissional','Valor','Pagamento','Ações'].map(h => (
                    <th key={h} className='text-left py-3 px-2 font-medium text-muted-foreground text-sm'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className='border-b border-border hover:bg-hover transition-colors'
                  >
                    <td className='py-3 px-2 text-sm'>
                      <div className='text-foreground font-medium'>
                        {appointment.date ? appointment.date.split('-').reverse().join('/') : '-'}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {appointment.time || '-'}
                      </div>
                    </td>
                    <td className='py-3 px-2 text-sm font-medium text-foreground'>{appointment.client}</td>
                    <td className='py-3 px-2 text-sm text-muted-foreground'>
                      {appointment.services.length > 0 ? appointment.services.join(', ') : '-'}
                      <div className='text-xs text-muted-foreground'>{appointment.duration}min</div>
                    </td>
                    <td className='py-3 px-2 text-sm text-muted-foreground'>{appointment.professional}</td>
                    <td className='py-3 px-2 text-sm font-medium text-foreground'>
                      R$ {appointment.price.toFixed(2).replace('.', ',')}
                    </td>
                    <td className='py-3 px-2 text-sm text-muted-foreground'>
                      {appointment.paymentMethod === 'CASH' ? 'Dinheiro' :
                       appointment.paymentMethod === 'CARD' ? 'Cartão' :
                       appointment.paymentMethod === 'PIX' ? 'PIX' :
                       appointment.paymentMethod === 'TRANSFER' ? 'Transferência' :
                       appointment.paymentMethod === 'OTHER' ? 'Outros' : 'N/A'}
                    </td>
                    <td className='py-3 px-2 text-sm flex gap-2'>
                      <Button
                        className='p-2 text-green-600 bg-green-200 hover:bg-green-100 rounded-lg transition-colors cursor-pointer'
                        onClick={() => setEditingAppointment(appointment)}
                      >
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button
                        className='p-2 text-red-600 bg-red-200 hover:bg-red-100 rounded-lg transition-colors cursor-pointer'
                        onClick={() => setDeletingAppointment(appointment)}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className='space-y-6'>
          <div className='bg-card rounded-2xl p-6 border border-border shadow-sm'>
            <div className='flex items-center gap-3 mb-4'>
              <Trophy className='w-5 h-5 text-accent-foreground' />
              <h4 className='font-semibold text-foreground'>Melhor Profissional</h4>
            </div>
            {topProfessional ? (
              <div className='text-center'>
                <div className='w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-lg font-bold'>
                  {topProfessional.name.charAt(0)}
                </div>
                <h5 className='mt-3 font-semibold text-foreground'>{topProfessional.name}</h5>
                <p className='text-sm text-muted-foreground'>{topProfessional.appointments} atendimentos concluídos</p>
                <p className='text-sm text-muted-foreground'>
                  Receita: R$ {topProfessional.revenue.toFixed(2).replace('.', ',')}
                </p>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Nenhum profissional disponível</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent className='!w-[95vw] !max-w-[1600px] !h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Editar Atendimento</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <ImmediateAppointmentForm
              initialData={{
                id: editingAppointment.id,
                clientId: editingAppointment.client,
                professionalId: editingAppointment.professional,
                serviceIds: editingAppointment.services,
                scheduledAt: `${editingAppointment.date}T${editingAppointment.time}:00.000Z`,
                total: editingAppointment.price.toString(),
                status: 'COMPLETED'
              }}
              onSuccess={() => setEditingAppointment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingAppointment} onOpenChange={() => setDeletingAppointment(null)}>
        <AlertDialogContent className='bg-card text-card-foreground border border-border rounded-2xl shadow-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-muted text-muted-foreground hover:bg-hover'>{'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAppointment) {
                  deleteMutation.mutate(deletingAppointment.id)
                  setDeletingAppointment(null)
                }
              }}
              disabled={deleteMutation.isLoading}
              className='bg-destructive text-destructive-foreground hover:bg-hover'
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
