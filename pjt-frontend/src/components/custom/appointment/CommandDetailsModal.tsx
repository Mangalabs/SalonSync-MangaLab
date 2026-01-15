import { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  ShoppingCart,
  Scissors,
  DollarSign,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from '@/lib/axios'

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
import { SimpleServiceSelector } from '@/components/custom/service/SimpleServiceSelector'
import { ProductSelector } from '@/components/custom/product/ProductSelector'

interface Service {
  id: string
  name: string
  price: number
}

interface Product {
  id: string
  name: string
  salePrice: string | number
  currentStock: string | number
  unit?: string
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
  status: string
  total: string | number
  client: {
    name: string
  }
  professional: {
    name: string
  }
  appointmentServices?: AppointmentService[]
  appointmentProducts?: AppointmentProduct[]
}

interface CommandDetailsModalProps {
  open: boolean
  onClose: () => void
  appointmentId: string
  onCheckout: (appointment: any) => void
}

export function CommandDetailsModal({
  open,
  onClose,
  appointmentId,
  onCheckout,
}: CommandDetailsModalProps) {
  const queryClient = useQueryClient()
  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<
    { productId: string; quantity: number }[]
  >([])

  // Buscar detalhes do appointment
  const { data: appointment, isLoading } = useQuery<Appointment>({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const res = await axios.get(`/api/appointments/${appointmentId}`)
      return res.data
    },
    enabled: open,
  })

  // Buscar serviços disponíveis
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await axios.get('/api/services')
      return res.data
    },
    enabled: showServiceSelector,
  })

  // Buscar produtos disponíveis
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('/api/products')
      return res.data
    },
    enabled: showProductSelector,
  })

  // Adicionar serviços
  const addServices = useMutation({
    mutationFn: async (serviceIds: string[]) => {
      const res = await axios.patch(
        `/api/appointments/${appointmentId}/services`,
        {
          action: 'add',
          serviceIds,
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appointment', appointmentId],
      })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setSelectedServiceIds([])
      setShowServiceSelector(false)
      toast.success('Serviços adicionados!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar serviços')
    },
  })

  // Remover serviço
  const removeServices = useMutation({
    mutationFn: async (serviceIds: string[]) => {
      const res = await axios.patch(
        `/api/appointments/${appointmentId}/services`,
        {
          action: 'remove',
          serviceIds,
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appointment', appointmentId],
      })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Serviço removido!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover serviço')
    },
  })

  // Adicionar produtos
  const addProducts = useMutation({
    mutationFn: async (products: { productId: string; quantity: number }[]) => {
      const res = await axios.patch(
        `/api/appointments/${appointmentId}/products`,
        {
          action: 'add',
          products,
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appointment', appointmentId],
      })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setSelectedProducts([])
      setShowProductSelector(false)
      toast.success('Produtos adicionados!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar produtos')
    },
  })

  // Remover produto
  const removeProducts = useMutation({
    mutationFn: async (productIds: string[]) => {
      const res = await axios.patch(
        `/api/appointments/${appointmentId}/products`,
        {
          action: 'remove',
          products: productIds.map((id) => ({ productId: id, quantity: 1 })), // Backend espera array de objetos
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appointment', appointmentId],
      })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Produto removido!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover produto')
    },
  })

  // Cancelar comanda
  const cancelAppointment = useMutation({
    mutationFn: async () => {
      const res = await axios.delete(`/api/appointments/${appointmentId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      toast.success('Comanda cancelada!')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao cancelar comanda')
    },
  })

  if (isLoading || !appointment) {
    return null
  }

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
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-between'>
            <div>
              <div className='text-lg font-semibold'>Gerenciar Comanda</div>
              <div className='text-sm font-normal text-muted-foreground mt-1'>
                {appointment.client.name} • {appointment.professional.name}
              </div>
            </div>
            <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30'>
              EM ANDAMENTO
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 mt-4'>
          {/* Serviços */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-medium flex items-center'>
                <Scissors className='w-4 h-4 mr-2' />
                Serviços
              </h3>
              {!showServiceSelector && (
                <button
                  onClick={() => setShowServiceSelector(true)}
                  className='text-sm text-primary hover:opacity-80 font-medium flex items-center gap-1'>
                  <Plus className='w-4 h-4' />
                  Adicionar
                </button>
              )}
            </div>

            {showServiceSelector ? (
              <div className='border border-border rounded-xl p-4 space-y-3'>
                <SimpleServiceSelector
                  services={services}
                  selectedServiceIds={selectedServiceIds}
                  onChange={setSelectedServiceIds}
                  label=''
                />
                <div className='flex gap-2'>
                  <button
                    onClick={() => {
                      if (selectedServiceIds.length > 0) {
                        addServices.mutate(selectedServiceIds)
                      }
                    }}
                    disabled={
                      selectedServiceIds.length === 0 || addServices.isPending
                    }
                    className='flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-xl font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed'>
                    {addServices.isPending ? 'Adicionando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedServiceIds([])
                      setShowServiceSelector(false)
                    }}
                    className='px-4 py-2 border border-border rounded-xl hover:bg-accent'>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                {appointment.appointmentServices &&
                appointment.appointmentServices.length > 0 ? (
                  appointment.appointmentServices.map((as) => (
                    <div
                      key={as.service.id}
                      className='flex items-center justify-between p-3 border border-border rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <span className='font-medium'>{as.service.name}</span>
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='font-semibold text-primary'>
                          R$ {Number(as.service.price).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeServices.mutate([as.service.id])}
                          disabled={removeServices.isPending}
                          className='text-destructive hover:opacity-70 p-1'>
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    Nenhum serviço adicionado
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Produtos */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-medium flex items-center'>
                <ShoppingCart className='w-4 h-4 mr-2' />
                Produtos
              </h3>
              {!showProductSelector && (
                <button
                  onClick={() => setShowProductSelector(true)}
                  className='text-sm text-primary hover:opacity-80 font-medium flex items-center gap-1'>
                  <Plus className='w-4 h-4' />
                  Adicionar
                </button>
              )}
            </div>

            {showProductSelector ? (
              <div className='border border-border rounded-xl p-4 space-y-3'>
                <ProductSelector
                  products={products}
                  selectedProducts={selectedProducts}
                  onChange={setSelectedProducts}
                  label=''
                />
                <div className='flex gap-2'>
                  <button
                    onClick={() => {
                      if (selectedProducts.length > 0) {
                        addProducts.mutate(selectedProducts)
                      }
                    }}
                    disabled={
                      selectedProducts.length === 0 || addProducts.isPending
                    }
                    className='flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-xl font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed'>
                    {addProducts.isPending ? 'Adicionando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProducts([])
                      setShowProductSelector(false)
                    }}
                    className='px-4 py-2 border border-border rounded-xl hover:bg-accent'>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                {appointment.appointmentProducts &&
                appointment.appointmentProducts.length > 0 ? (
                  appointment.appointmentProducts.map((ap) => (
                    <div
                      key={ap.product.id}
                      className='flex items-center justify-between p-3 border border-border rounded-lg'>
                      <div className='flex flex-col'>
                        <span className='font-medium'>{ap.product.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          {ap.quantity} × R$ {Number(ap.unitPrice).toFixed(2)} =
                          R$ {Number(ap.total).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeProducts.mutate([ap.product.id])}
                        disabled={removeProducts.isPending}
                        className='text-destructive hover:opacity-70 p-1'>
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    Nenhum produto adicionado
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Resumo Total */}
          <div className='border-t border-border pt-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Serviços</span>
              <span className='font-medium'>R$ {servicesTotal.toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Produtos</span>
              <span className='font-medium'>R$ {productsTotal.toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-lg font-semibold border-t border-border pt-2'>
              <span className='flex items-center'>
                <DollarSign className='w-5 h-5 mr-1' />
                Total
              </span>
              <span className='text-primary'>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className='flex gap-3'>
            <button
              onClick={() => setShowCancelDialog(true)}
              disabled={cancelAppointment.isPending}
              className='flex-1 bg-destructive/10 text-destructive py-3 px-6 rounded-xl font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-destructive/30'>
              {cancelAppointment.isPending
                ? 'Cancelando...'
                : 'Cancelar Comanda'}
            </button>
            <button
              onClick={() => onCheckout(appointment)}
              disabled={total <= 0}
              className='flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'>
              Finalizar Atendimento
            </button>
          </div>
        </div>
      </DialogContent>

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Comanda?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta comanda? Esta ação não pode
              ser desfeita e todos os serviços e produtos adicionados serão
              removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter comanda</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancelAppointment.mutate()
                setShowCancelDialog(false)
              }}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Sim, cancelar comanda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
