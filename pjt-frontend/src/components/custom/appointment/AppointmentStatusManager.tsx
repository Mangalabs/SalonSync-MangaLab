import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Play, DollarSign } from 'lucide-react'

import axios from '@/lib/axios'
import { AppointmentConfirmationForm } from './AppointmentConfirmationForm'

interface AppointmentStatusManagerProps {
  appointment: any
  onSuccess: () => void
}

export function AppointmentStatusManager({
  appointment,
  onSuccess,
}: AppointmentStatusManagerProps) {
  const queryClient = useQueryClient()

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/confirm`)
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-commission'] })
      queryClient.invalidateQueries({ queryKey: ['daily-commission'] })
      toast.success(getSuccessMessage())
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erro ao atualizar status',
      )
    },
  })

  const getSuccessMessage = () => {
    switch (appointment.status) {
      case 'pending':
        return 'Cliente confirmado como presente!'
      case 'confirmed':
        return 'Atendimento iniciado!'
      case 'in-progress':
        return 'Atendimento finalizado!'
      default:
        return 'Status atualizado!'
    }
  }

  const getButtonText = () => {
    switch (appointment.status) {
      case 'pending':
        return 'Cliente Chegou'
      case 'confirmed':
        return 'Iniciar Atendimento'
      case 'in-progress':
        return 'Finalizar & Cobrar'
      default:
        return 'Confirmar'
    }
  }

  const getButtonIcon = () => {
    switch (appointment.status) {
      case 'pending':
        return <Check className='w-4 h-4' />
      case 'confirmed':
        return <Play className='w-4 h-4' />
      case 'in-progress':
        return <DollarSign className='w-4 h-4' />
      default:
        return <Check className='w-4 h-4' />
    }
  }

  // Se está IN_PROGRESS, mostrar o form de checkout
  if (appointment.status === 'in-progress') {
    return (
      <AppointmentConfirmationForm
        appointment={appointment}
        onSuccess={onSuccess}
      />
    )
  }

  // Para PENDING e CONFIRMED, mostrar botão simples
  return (
    <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
      <h3 className='text-lg font-semibold text-foreground mb-6'>
        Gerenciar Agendamento
      </h3>
      
      <div className='space-y-4 mb-6'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='text-xs text-muted-foreground uppercase tracking-wider'>
              Cliente
            </label>
            <p className='text-foreground mt-1'>{appointment.client}</p>
          </div>
          <div>
            <label className='text-xs text-muted-foreground uppercase tracking-wider'>
              Profissional
            </label>
            <p className='text-foreground mt-1'>{appointment.professional}</p>
          </div>
        </div>

        <div>
          <label className='text-xs text-muted-foreground uppercase tracking-wider'>
            Serviço
          </label>
          <p className='text-foreground mt-1'>{appointment.service}</p>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='text-xs text-muted-foreground uppercase tracking-wider'>
              Horário
            </label>
            <p className='text-foreground mt-1'>{appointment.time}</p>
          </div>
          <div>
            <label className='text-xs text-muted-foreground uppercase tracking-wider'>
              Status Atual
            </label>
            <p className='text-foreground mt-1'>
              {appointment.status === 'pending' && 'Pendente'}
              {appointment.status === 'confirmed' && 'Confirmado'}
              {appointment.status === 'in-progress' && 'Em Andamento'}
              {appointment.status === 'completed' && 'Concluído'}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => updateStatusMutation.mutate()}
        disabled={updateStatusMutation.isLoading}
        className='w-full bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer'>
        {getButtonIcon()}
        {updateStatusMutation.isLoading ? 'Atualizando...' : getButtonText()}
      </button>

      <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl'>
        <p className='text-sm text-blue-800'>
          {appointment.status === 'pending' && 
            'Confirme quando o cliente chegar ao estabelecimento.'}
          {appointment.status === 'confirmed' && 
            'Inicie o atendimento quando estiver pronto para começar.'}
        </p>
      </div>
    </div>
  )
}