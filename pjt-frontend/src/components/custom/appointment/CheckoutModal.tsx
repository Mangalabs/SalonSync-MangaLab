import { useState } from 'react'
import {
  DollarSign,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from '@/lib/axios'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Service {
  id: string
  name: string
  price: number
}

interface Product {
  id: string
  name: string
}

interface AppointmentService {
  service: Service
}

interface AppointmentProduct {
  product: Product
  quantity: number
  unitPrice: string | number
  total: string | number
}

interface Appointment {
  id: string
  total: string | number
  client:
    | {
        name: string
      }
    | string // Pode ser string ou objeto
  professional:
    | {
        name: string
      }
    | string // Pode ser string ou objeto
  appointmentServices?: AppointmentService[]
  appointmentProducts?: AppointmentProduct[]
}

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  appointment: Appointment
  onSuccess: () => void
}

const paymentMethods = [
  { value: 'CASH', label: 'Dinheiro', icon: Banknote },
  { value: 'CARD', label: 'Cartão', icon: CreditCard },
  { value: 'PIX', label: 'PIX', icon: Smartphone },
  { value: 'TRANSFER', label: 'Transferência', icon: Building2 },
  { value: 'OTHER', label: 'Outro', icon: DollarSign },
]

export function CheckoutModal({
  open,
  onClose,
  appointment,
  onSuccess,
}: CheckoutModalProps) {
  const queryClient = useQueryClient()
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [notes, setNotes] = useState('')

  // Helper para extrair nome (compatível com string ou objeto)
  const getClientName = () => {
    if (typeof appointment.client === 'string') {
      return appointment.client
    }
    return appointment.client.name
  }

  const getProfessionalName = () => {
    if (typeof appointment.professional === 'string') {
      return appointment.professional
    }
    return appointment.professional.name
  }

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `/api/appointments/${appointment.id}/checkout`,
        {
          paymentMethod,
          notes: notes.trim() || undefined,
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({
        queryKey: ['appointment', appointment.id],
      })
      toast.success('Atendimento finalizado com sucesso!')
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erro ao finalizar atendimento'
      )
    },
  })

  const total = Number(appointment.total || 0)
  const servicesTotal =
    appointment.appointmentServices?.reduce(
      (sum, as) => sum + Number(as.service.price),
      0
    ) || 0
  const productsTotal =
    appointment.appointmentProducts?.reduce(
      (sum, ap) => sum + Number(ap.total),
      0
    ) || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-md sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Finalizar Atendimento</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 mt-2'>
          {/* Informações do Cliente */}
          <div className='bg-accent/20 rounded-lg p-3'>
            <div className='text-xs text-muted-foreground mb-0.5'>Cliente</div>
            <div className='font-medium text-sm'>{getClientName()}</div>
            <div className='text-xs text-muted-foreground mt-2 mb-0.5'>
              Profissional
            </div>
            <div className='font-medium text-sm'>{getProfessionalName()}</div>
          </div>

          {/* Resumo de Serviços */}
          {appointment.appointmentServices &&
            appointment.appointmentServices.length > 0 && (
              <div>
                <h3 className='text-sm font-medium mb-2'>Serviços</h3>
                <div className='space-y-1'>
                  {appointment.appointmentServices.map((as) => (
                    <div
                      key={as.service.id}
                      className='flex justify-between text-sm'>
                      <span className='text-xs sm:text-sm'>
                        {as.service.name}
                      </span>
                      <span className='font-medium text-xs sm:text-sm'>
                        R$ {Number(as.service.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className='flex justify-between text-sm font-medium border-t border-border pt-1 mt-1'>
                    <span className='text-xs sm:text-sm'>
                      Subtotal Serviços
                    </span>
                    <span className='text-xs sm:text-sm'>
                      R$ {servicesTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Resumo de Produtos */}
          {appointment.appointmentProducts &&
            appointment.appointmentProducts.length > 0 && (
              <div>
                <h3 className='text-sm font-medium mb-2'>Produtos</h3>
                <div className='space-y-1'>
                  {appointment.appointmentProducts.map((ap) => (
                    <div
                      key={ap.product.id}
                      className='flex justify-between text-sm'>
                      <span className='text-xs sm:text-sm'>
                        {ap.product.name}{' '}
                        <span className='text-muted-foreground'>
                          (x{ap.quantity})
                        </span>
                      </span>
                      <span className='font-medium text-xs sm:text-sm'>
                        R$ {Number(ap.total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className='flex justify-between text-sm font-medium border-t border-border pt-1 mt-1'>
                    <span className='text-xs sm:text-sm'>
                      Subtotal Produtos
                    </span>
                    <span className='text-xs sm:text-sm'>
                      R$ {productsTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Total */}
          <div className='bg-primary/10 rounded-lg p-3 border border-primary/30'>
            <div className='flex items-center justify-between'>
              <span className='flex items-center font-semibold text-sm sm:text-base'>
                <DollarSign className='w-4 h-4 sm:w-5 sm:h-5 mr-1' />
                Total
              </span>
              <span className='text-primary text-xl sm:text-2xl font-bold'>
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className='block text-sm font-medium mb-2'>
              Método de Pagamento
            </label>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const selected = paymentMethod === method.value
                return (
                  <button
                    key={method.value}
                    type='button'
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border transition-all ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary hover:bg-accent/10'
                    }`}>
                    <Icon className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                    <span className='text-xs sm:text-sm'>{method.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className='block text-sm font-medium mb-2'>
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Adicione observações...'
              rows={2}
              className='w-full p-2 sm:p-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground resize-none'
            />
          </div>

          {/* Botões */}
          <div className='flex gap-2 sm:gap-3'>
            <button
              onClick={onClose}
              disabled={checkout.isPending}
              className='flex-1 px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-border rounded-xl hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed'>
              Cancelar
            </button>
            <button
              onClick={() => checkout.mutate()}
              disabled={checkout.isPending}
              className='flex-1 bg-primary text-primary-foreground py-2.5 px-4 sm:py-3 sm:px-6 rounded-xl font-medium text-sm hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'>
              {checkout.isPending ? 'Finalizando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
