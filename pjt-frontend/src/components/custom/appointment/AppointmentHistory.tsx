import React, { useState } from 'react'
import { Trophy, Edit, Trash2, Check } from 'lucide-react'
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
import { AppointmentForm } from '@/components/custom/appointment/AppointmentForm'

interface Appointment {
  id: string;
  scheduledAt: string | Date | null;
  status?: string;
  professional: { name: string } | null;
  client: { name: string } | null;
  appointmentServices?: {
    service: { name: string; price: string };
  }[];
  total?: string;
  rating?: number;
  branchId?: string;
}

interface AppointmentHistory {
  id: string;
  date: string;
  time: string;
  client: string;
  services: string[];
  professional: string;
  duration: number;
  price: number;
  status?: string;
  rating?: number;
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
      const dateObj = apt.scheduledAt ? new Date(apt.scheduledAt) : null
      const dateStr = dateObj ? dateObj.toISOString().split('T')[0] : ''
      const timeStr = dateObj
        ? dateObj.toISOString().split('T')[1]?.slice(0, 5) || ''
        : ''

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
      <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end'>
        <div className='flex flex-col'>
          <label className='text-gray-600 text-sm mb-1'>Profissional</label>
          <select
            value={filterProfessional}
            onChange={(e) => setFilterProfessional(e.target.value)}
            className='px-3 py-2 border rounded-lg'>
            <option value='all'>Todos</option>
            {professionals.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className='flex flex-col'>
          <label className='text-gray-600 text-sm mb-1'>Serviço</label>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className='px-3 py-2 border rounded-lg'>
            <option value='all'>Todos</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className='flex flex-col'>
          <label className='text-gray-600 text-sm mb-1'>Data Início</label>
          <input
            type='date'
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className='px-3 py-2 border rounded-lg'
          />
        </div>

        <div className='flex flex-col'>
          <label className='text-gray-600 text-sm mb-1'>Data Fim</label>
          <input
            type='date'
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className='px-3 py-2 border rounded-lg'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-800 mb-4'>
            Histórico de Atendimentos
          </h3>

          <div
            className={`overflow-x-auto ${
              filteredHistory.length > 7
                ? 'overflow-y-scroll max-h-[500px]'
                : ''
            }`}>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-3 px-2 font-medium text-gray-700 text-sm'>
                    Data
                  </th>
                  <th className='text-left py-3 px-2 font-medium text-gray-700 text-sm'>
                    Cliente
                  </th>
                  <th className='text-left py-3 px-2 font-medium text-gray-700 text-sm'>
                    Serviços
                  </th>
                  <th className='text-left py-3 px-2 font-medium text-gray-700 text-sm'>
                    Profissional
                  </th>
                  <th className='text-left py-3 px-2 font-medium text-gray-700 text-sm'>
                    Valor
                  </th>
                  <th className='text-left py-3 px-2 font-medium text-gray-700 text-sm'>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                    <td className='py-3 px-2 text-sm'>
                      <div className='text-gray-800 font-medium'>
                        {appointment.date
                          ? new Date(appointment.date).toLocaleDateString(
                            'pt-BR',
                          )
                          : '-'}
                      </div>
                      <div className='text-gray-500 text-xs'>
                        {appointment.time || '-'}
                      </div>
                    </td>
                    <td className='py-3 px-2 text-sm font-medium text-gray-800'>
                      {appointment.client}
                    </td>
                    <td className='py-3 px-2 text-sm text-gray-600'>
                      {appointment.services.length > 0
                        ? appointment.services.join(', ')
                        : '-'}
                      <div className='text-xs text-gray-500'>
                        {appointment.duration}min
                      </div>
                    </td>
                    <td className='py-3 px-2 text-sm text-gray-600'>
                      {appointment.professional}
                    </td>
                    <td className='py-3 px-2 text-sm font-medium text-gray-800'>
                      R$ {appointment.price.toFixed(2).replace('.', ',')}
                    </td>
                    <td className='py-3 px-2 text-sm flex gap-2'>
                      <Button
                        className='p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors'
                        onClick={() => setEditingAppointment(appointment)}
                      >
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button
                        className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
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
          <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
            <div className='flex items-center gap-3 mb-4'>
              <Trophy className='w-5 h-5 text-yellow-500' />
              <h4 className='font-semibold text-gray-800'>
                Melhor Profissional
              </h4>
            </div>
            {topProfessional ? (
              <div className='text-center'>
                <div className='w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-lg font-bold'>
                  {topProfessional.name.charAt(0)}
                </div>
                <h5 className='mt-3 font-semibold text-gray-800'>
                  {topProfessional.name}
                </h5>
                <p className='text-sm text-gray-600'>
                  {topProfessional.appointments} atendimentos concluídos
                </p>
                <p className='text-sm text-gray-600'>
                  Receita: R${' '}
                  {topProfessional.revenue.toFixed(2).replace('.', ',')}
                </p>
              </div>
            ) : (
              <p className='text-sm text-gray-500'>
                Nenhum profissional disponível
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={!!editingAppointment}
        onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Editar Atendimento</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <AppointmentForm
              mode='immediate'
              initialData={editingAppointment}
              onSuccess={() => setEditingAppointment(null)}
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
                  deleteMutation.mutate(deletingAppointment.id)
                  setDeletingAppointment(null)
                }
              }}
              disabled={deleteMutation.isLoading}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
