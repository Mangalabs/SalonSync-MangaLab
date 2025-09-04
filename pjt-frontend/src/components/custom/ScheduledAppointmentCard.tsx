import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'


interface ScheduledAppointment {
  id: string;
  professional: { name: string } | null;
  client: { name: string };
  appointmentServices: {
    service: { name: string; price: number };
  }[];
  total: number;
  scheduledAt: string;
  status: string;
}

export function ScheduledAppointmentCard({ appointment }: { appointment: ScheduledAppointment }) {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/confirm`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', activeBranch?.id] })
      queryClient.invalidateQueries({ queryKey: ['monthly-commission'] })
      queryClient.invalidateQueries({ queryKey: ['daily-commission'] })
      queryClient.invalidateQueries({ queryKey: ['professional'] })
      toast.success('Agendamento confirmado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao confirmar agendamento')
    
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/cancel`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', activeBranch?.id] })
      toast.success('Agendamento cancelado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao cancelar agendamento')
    
    },
  })

  const appointmentDate = new Date(appointment.scheduledAt)
  const today = new Date()
  const isToday = appointmentDate.toDateString() === today.toDateString()
  const isPast = appointmentDate < today

  return (
    <div className={`border rounded-lg shadow-sm ${
      isPast ? 'border-red-200 bg-red-50' : isToday ? 'border-blue-200 bg-blue-50' : 'bg-white'
    }`}>
      <div className="p-3 md:p-4 pb-2 md:pb-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 min-w-0">
            <User className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            <span className="truncate">{appointment.client.name}</span>
          </h3>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${
            isPast ? 'bg-red-100 text-red-800' : 
              isToday ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'
          }`}>
            {isPast ? 'Atrasado' : isToday ? 'Hoje' : 'Agendado'}
          </span>
        </div>
      </div>
      <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-2 md:space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
            <span>{appointmentDate.toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            <span>{appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="text-xs md:text-sm">
          <strong>Profissional:</strong> {appointment.professional?.name || 'Profissional removido'}
        </div>

        <div className="text-xs md:text-sm">
          <strong>Serviços:</strong>
          <ul className="mt-1 space-y-1">
            {appointment.appointmentServices.map((as, index) => (
              <li key={index} className="flex justify-between gap-2">
                <span className="truncate">• {as.service.name}</span>
                <span className="flex-shrink-0">R$ {as.service.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t gap-2">
          <div className="flex items-center gap-1 font-semibold text-sm md:text-base">
            <DollarSign className="h-4 w-4" />
            <span>R$ {appointment.total.toFixed(2)}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="text-red-600 hover:text-red-700 text-xs sm:text-sm h-8"
            >
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Cancelar
            </Button>
            {(isToday || isPast) && (
              <Button
                size="sm"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A] text-xs sm:text-sm h-8"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Confirmar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}