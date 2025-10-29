import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

import axios from '@/lib/axios'

const confirmationSchema = z.object({
  paymentMethod: z.string().min(1, 'Selecione um método de pagamento'),
})

type ConfirmationFormData = z.infer<typeof confirmationSchema>

interface AppointmentConfirmationFormProps {
  appointment: any
  onSuccess: () => void
}

export function AppointmentConfirmationForm({
  appointment,
  onSuccess,
}: AppointmentConfirmationFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmationFormData>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      paymentMethod: 'CASH',
    },
  })

  const confirmMutation = useMutation({
    mutationFn: async (data: ConfirmationFormData) => {
      await axios.post(`/api/appointments/${appointment.id}/confirm`, {
        paymentMethod: data.paymentMethod,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-commission'] })
      queryClient.invalidateQueries({ queryKey: ['daily-commission'] })
      queryClient.invalidateQueries({ queryKey: ['professional'] })
      queryClient.invalidateQueries({ queryKey: ['financial'] })
      toast.success('Agendamento confirmado com sucesso!')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erro ao confirmar agendamento',
      )
    },
  })

  const onSubmit = (data: ConfirmationFormData) => {
    confirmMutation.mutate(data)
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      <div className='lg:col-span-2 bg-card rounded-2xl p-6 shadow-sm border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-6'>
          Confirmar Agendamento
        </h3>
        <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                Cliente
              </label>
              <input
                value={appointment.client}
                readOnly
                className='w-full p-3 border border-border rounded-xl bg-muted text-foreground cursor-not-allowed'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                Profissional
              </label>
              <input
                value={appointment.professional}
                readOnly
                className='w-full p-3 border border-border rounded-xl bg-muted text-foreground cursor-not-allowed'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Serviço
            </label>
            <input
              value={appointment.service}
              readOnly
              className='w-full p-3 border border-border rounded-xl bg-muted text-foreground cursor-not-allowed'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                Data
              </label>
              <input
                value={new Date(appointment.scheduledAt).toLocaleDateString(
                  'pt-BR',
                )}
                readOnly
                className='w-full p-3 border border-border rounded-xl bg-muted text-foreground cursor-not-allowed'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                Horário
              </label>
              <input
                value={appointment.time}
                readOnly
                className='w-full p-3 border border-border rounded-xl bg-muted text-foreground cursor-not-allowed'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Método de Pagamento *
            </label>
            <select
              {...register('paymentMethod')}
              className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
              <option value='CASH'>Dinheiro</option>
              <option value='CARD'>Cartão</option>
              <option value='PIX'>PIX</option>
              <option value='TRANSFER'>Transferência</option>
              <option value='OTHER'>Outros</option>
            </select>
            {errors.paymentMethod && (
              <p className='text-xs text-destructive mt-1'>
                {errors.paymentMethod.message}
              </p>
            )}
          </div>

          <div className='flex space-x-4'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer'>
              <Check className='w-4 h-4' />
              {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>

      <div className='space-y-6'>
        <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
          <h4 className='font-semibold text-foreground mb-4'>
            Resumo do Agendamento
          </h4>
          <div className='space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Cliente:</span>
              <span className='font-semibold'>{appointment.client}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Profissional:</span>
              <span className='font-semibold'>{appointment.professional}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Data/Hora:</span>
              <span className='font-semibold'>
                {new Date(appointment.scheduledAt).toLocaleDateString('pt-BR')}{' '}
                às {appointment.time}
              </span>
            </div>
          </div>
        </div>

        <div className='bg-green-50 rounded-2xl p-6 border border-green-200'>
          <h4 className='font-semibold text-green-800 mb-2'>
            Confirmação de Agendamento
          </h4>
          <p className='text-sm text-green-700'>
            Ao confirmar, este agendamento será marcado como concluído e será
            contabilizado na receita e comissões.
          </p>
        </div>
      </div>
    </div>
  )
}
