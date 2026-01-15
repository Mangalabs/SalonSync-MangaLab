import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'

import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'

interface EditCompletedAppointmentFormProps {
  appointmentId: string
  onSuccess: () => void
  onCancel: () => void
}

export function EditCompletedAppointmentForm({
  appointmentId,
  onSuccess,
  onCancel,
}: EditCompletedAppointmentFormProps) {
  const queryClient = useQueryClient()

  // Buscar appointment completo
  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const res = await axios.get(`/api/appointments/${appointmentId}`)
      return res.data
    },
  })

  // Estados do formulário
  const [clientId, setClientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [products, setProducts] = useState<
    { productId: string; quantity: number }[]
  >([])
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [notes, setNotes] = useState('')

  // Buscar clientes
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await axios.get('/api/clients')
      return res.data
    },
  })

  // Garantir que clients é sempre um array
  const clients = Array.isArray(clientsData)
    ? clientsData
    : clientsData?.clients
    ? clientsData.clients
    : []

  // Buscar profissionais
  const { data: professionalsData } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data
    },
  })

  const professionals = Array.isArray(professionalsData)
    ? professionalsData
    : []

  // Buscar serviços
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await axios.get('/api/services')
      return res.data
    },
  })

  const services = Array.isArray(servicesData) ? servicesData : []

  // Buscar produtos
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('/api/products')
      return res.data
    },
  })

  const availableProducts = Array.isArray(productsData) ? productsData : []

  // Preencher formulário quando appointment carregar
  useEffect(() => {
    if (appointment) {
      setClientId(appointment.clientId || '')
      setProfessionalId(appointment.professionalId || '')
      setServiceIds(
        appointment.appointmentServices?.map((as: any) => as.serviceId) || []
      )
      setProducts(
        appointment.appointmentProducts?.map((ap: any) => ({
          productId: ap.productId,
          quantity: Number(ap.quantity),
        })) || []
      )
      setPaymentMethod(appointment.paymentMethod || 'CASH')
      setNotes(appointment.notes || '')
    }
  }, [appointment])

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async () => {
      // 1. Primeiro cancelar o appointment (reverte tudo)
      await axios.delete(`/api/appointments/${appointmentId}`)

      // 2. Criar novo appointment com os dados corrigidos
      const scheduledAt = appointment.scheduledAt
      const newAppointment = await axios.post('/api/appointments', {
        clientId,
        professionalId,
        serviceIds,
        scheduledAt,
        status: 'IN_PROGRESS',
      })

      // 3. Adicionar produtos se houver
      if (products.length > 0) {
        await axios.patch(
          `/api/appointments/${newAppointment.data.id}/products`,
          {
            action: 'add',
            products,
          }
        )
      }

      // 4. Fazer checkout
      await axios.post(`/api/appointments/${newAppointment.data.id}/checkout`, {
        paymentMethod,
        notes,
      })

      return newAppointment.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment'] })
      queryClient.invalidateQueries({ queryKey: ['professional-commission'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Atendimento atualizado com sucesso!')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erro ao atualizar atendimento'
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId || !professionalId || serviceIds.length === 0) {
      toast.error('Preencha cliente, profissional e pelo menos um serviço')
      return
    }

    updateMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>Editar Atendimento Finalizado</h3>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={onCancel}
          className='h-8 w-8'>
          <X className='h-4 w-4' />
        </Button>
      </div>

      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4'>
        <div className='text-sm text-yellow-800'>
          <p className='font-semibold'>⚠️ Atenção:</p>
          <p className='mt-1'>Editar um atendimento finalizado irá:</p>
          <ul className='list-disc list-inside mt-2 space-y-1'>
            <li>Reverter o estoque dos produtos antigos</li>
            <li>Deletar as transações financeiras antigas</li>
            <li>Recriar o atendimento com os novos dados</li>
            <li>Recalcular comissões e estoque</li>
          </ul>
        </div>
      </div>

      {/* Cliente */}
      <div>
        <label className='block text-sm font-medium mb-2'>Cliente *</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className='w-full p-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring'>
          <option value=''>Selecione o cliente</option>
          {clients.map((client: any) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Profissional */}
      <div>
        <label className='block text-sm font-medium mb-2'>Profissional *</label>
        <select
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
          required
          className='w-full p-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring'>
          <option value=''>Selecione o profissional</option>
          {professionals.map((prof: any) => (
            <option key={prof.id} value={prof.id}>
              {prof.name}
            </option>
          ))}
        </select>
      </div>

      {/* Serviços */}
      <div>
        <label className='block text-sm font-medium mb-2'>Serviços *</label>
        <div className='space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3'>
          {services.map((service: any) => (
            <label
              key={service.id}
              className='flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded'>
              <input
                type='checkbox'
                checked={serviceIds.includes(service.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setServiceIds([...serviceIds, service.id])
                  } else {
                    setServiceIds(serviceIds.filter((id) => id !== service.id))
                  }
                }}
                className='rounded'
              />
              <span className='flex-1'>{service.name}</span>
              <span className='text-sm text-muted-foreground'>
                R$ {Number(service.price).toFixed(2)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Produtos */}
      <div>
        <label className='block text-sm font-medium mb-2'>
          Produtos (opcional)
        </label>
        <div className='space-y-2'>
          {products.map((product, index) => {
            const productInfo = availableProducts.find(
              (p: any) => p.id === product.productId
            )
            return (
              <div key={index} className='flex gap-2 items-center'>
                <select
                  value={product.productId}
                  onChange={(e) => {
                    const newProducts = [...products]
                    newProducts[index].productId = e.target.value
                    setProducts(newProducts)
                  }}
                  className='flex-1 p-2 border border-border rounded-lg'>
                  <option value=''>Selecione o produto</option>
                  {availableProducts.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - R$ {Number(p.salePrice).toFixed(2)}
                    </option>
                  ))}
                </select>
                <input
                  type='number'
                  min='1'
                  value={product.quantity}
                  onChange={(e) => {
                    const newProducts = [...products]
                    newProducts[index].quantity = Number(e.target.value)
                    setProducts(newProducts)
                  }}
                  className='w-24 p-2 border border-border rounded-lg'
                  placeholder='Qtd'
                />
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  onClick={() => {
                    setProducts(products.filter((_, i) => i !== index))
                  }}>
                  Remover
                </Button>
              </div>
            )
          })}
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() =>
              setProducts([...products, { productId: '', quantity: 1 }])
            }>
            + Adicionar Produto
          </Button>
        </div>
      </div>

      {/* Método de Pagamento */}
      <div>
        <label className='block text-sm font-medium mb-2'>
          Método de Pagamento *
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
          className='w-full p-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring'>
          <option value='CASH'>Dinheiro</option>
          <option value='CARD'>Cartão</option>
          <option value='PIX'>PIX</option>
          <option value='TRANSFER'>Transferência</option>
          <option value='OTHER'>Outro</option>
        </select>
      </div>

      {/* Observações */}
      <div>
        <label className='block text-sm font-medium mb-2'>
          Observações (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className='w-full p-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none'
          placeholder='Observações sobre o atendimento...'
        />
      </div>

      {/* Botões */}
      <div className='flex gap-3'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={updateMutation.isPending}
          className='flex-1'>
          Cancelar
        </Button>
        <Button
          type='submit'
          disabled={updateMutation.isPending}
          className='flex-1'>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  )
}
