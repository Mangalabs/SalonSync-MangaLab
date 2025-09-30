import { useEffect, useState } from 'react'
import {
  Search,
  Edit,
  Calendar,
  Trash2,
  Star,
  ChevronDown,
  Building2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { AppointmentForm } from '@/components/custom/appointment/AppointmentForm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Client {
  id: string
  customerId: string
  name: string
  phone?: string
  email?: string
  branchId?: string
  lastVisit?: string
  subscription: { planName: string }
}

interface ClientTableProps {
  onEdit: (client: Client) => void
}

export function ClientTable({ onEdit }: ClientTableProps) {
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { activeBranch } = useBranch()
  const [prices, setPrices] = useState([])
  const [selectedPrice, setSelectedPrice] = useState(null)
  const [planUrlLoading, setPlanUrlLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showPlanSelection, setShowPlanSelection] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    const fetchPrices = async () => {
      const response = await axios.get(
        '/api/payment/get-prices-for-connected-account',
      )

      setPrices(response.data)
    }

    fetchPrices()
  }, [])

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery<Client[]>({
    queryKey: ['clients', activeBranch?.id],
    queryFn: async () => {
      const params = activeBranch?.id ? `?branchId=${activeBranch.id}` : ''
      const res = await axios.get(`/api/clients${params}`)
      return res.data
    },
    enabled: !!activeBranch,
  })

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/clients/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', activeBranch?.id] })
      setDeletingClientId(null)
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-alert
      alert(error.response?.data?.message || 'Erro ao excluir cliente')
      setDeletingClientId(null)
    },
  })

  const filteredClients = clients?.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className='bg-card rounded-2xl p-6 shadow-sm border-theme'>
        <div className='mb-6'>
          <Skeleton className='h-12 w-full rounded-xl' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='border-theme rounded-xl p-6'>
              <div className='flex items-center space-x-3 mb-4'>
                <Skeleton className='w-12 h-12 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-32' />
                  <Skeleton className='h-3 w-28' />
                </div>
              </div>
              <Skeleton className='h-4 w-full mb-4' />
              <div className='flex space-x-2'>
                <Skeleton className='h-8 flex-1' />
                <Skeleton className='h-8 flex-1' />
                <Skeleton className='h-8 flex-1' />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <p className='p-4 text-center text-destructive'>
        {'Erro ao carregar clientes'}
      </p>
    )
  }

  const handleSchedule = (client: Client) => {
    setSelectedClient(client)
    setShowForm(true)
  }

  const handleFidelityButtonClicked = async (client: Client) => {
    if (!client.subscription) {
      setSelectedClient(client)
      setShowPlanSelection(true)
    } else {
      const response = await axios.post(
        '/api/fidelity/create-management-session',
        {
          clientId: client.id,
          email: client.email,
          accountId: user.accountId,
        },
      )
      setPlanUrlLoading(false)
      navigator.clipboard.writeText(response.data)
      toast.success('Url copiada para área de transferência (CRTL + V)')
    }
  }

  const handleGenerateUrl = async () => {
    setPlanUrlLoading(true)
    const response = await axios.post('/api/fidelity/create-checkout-session', {
      clientId: selectedClient.id,
      email: selectedClient.email,
      accountId: user.accountId,
      priceId: selectedPrice.id,
    })
    setPlanUrlLoading(false)
    navigator.clipboard.writeText(response.data)
    toast.success('Url copiada para área de transferência (CRTL + V)')
  }

  if (isLoading) {
    return <p className='p-4'>Carregando...</p>
  }

  if (error) {
    return <p className='p-4 text-red-500'>Erro ao carregar clientes</p>
  }

  return (
    <div
      className='rounded-2xl p-3 sm:p-6 shadow-sm border'
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}>
      <div className='mb-4 sm:mb-6 relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5' />
        <input
          type='text'
          placeholder='Buscar clientes...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full pl-9 pr-4 py-2 sm:py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent bg-popover text-popover-foreground text-sm sm:text-base'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredClients && filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className='border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card'
              style={{ backgroundColor: 'var(--color-card)' }}>
              <div className='flex items-center justify-between mb-4 gap-4'>
                <div className='flex items-center space-x-3 flex-1 min-w-0'>
                  <div
                    className='w-12 h-12 rounded-full flex items-center justify-center'
                    style={{ background: 'var(--color-accent)' }}>
                    <span className='text-accent-foreground font-semibold text-lg'>
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-semibold text-foreground truncate'>
                      {client.name}
                    </h4>
                    {client.phone && (
                      <p className='text-sm text-muted-foreground truncate'>
                        {client.phone}
                      </p>
                    )}
                    {client.email && (
                      <p className='text-xs text-muted-foreground truncate'>
                        {client.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {client.subscription?.planName ? (
                    <span className="px-3 py-2 bg-yellow-100 border border-yellow-200 text-yellow-600 font-semibold shadow-sm rounded-lg text-sm transition-all duration-200 uppercase flex items-center justify-center">
                      {client.subscription.planName}
                    </span>

                  ) : (
                    <span className='text-xs text-muted-foreground px-3 py-2 bg-gray-100 font-semibold rounded-lg transition-all duration-200 uppercase flex items-center justify-center'>
                      Sem Assinatura
                    </span>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2 mb-2'>
                <Button
                  onClick={() => onEdit(client)}
                  className='bg-blue-100 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-1'>
                  <Edit className='w-3 h-3' />
                  Editar
                </Button>
                <Button
                  onClick={() => handleSchedule(client)}
                  className='bg-green-100 text-green-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-1'>
                  <Calendar className='w-3 h-3' />
                  Agendar
                </Button>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <Button
                  onClick={() => handleFidelityButtonClicked(client)}
                  className='bg-yellow-100 text-yellow-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center justify-center gap-1'>
                  <Star className='w-3 h-3' />
                  Fidelidade
                </Button>
                <Button
                  onClick={() => setDeletingClientId(client.id)}
                  disabled={deleteClient.isPending}
                  className='bg-red-100 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-1'>
                  <Trash2 className='w-3 h-3' />
                  Excluir
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className='col-span-full text-center py-12'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Search className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Nenhum cliente encontrado
            </h3>
            <p className='text-gray-500'>
              Tente buscar com um termo diferente ou adicione um novo cliente.
            </p>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deletingClientId}
        onOpenChange={() => setDeletingClientId(null)}>
        <AlertDialogContent
          className='max-w-[95vw] sm:max-w-md'
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base sm:text-lg text-foreground'>
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs sm:text-sm text-muted-foreground'>
              Tem certeza que deseja excluir este cliente? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='text-xs sm:text-sm text-muted-foreground'>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingClientId && deleteClient.mutate(deletingClientId)
              }
              disabled={deleteClient.isPending}
              className='text-xs sm:text-sm text-destructive-foreground'
              style={{ backgroundColor: 'var(--color-destructive)' }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent
          className='max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-2xl'
          style={{ backgroundColor: 'var(--color-card)' }}>
          <DialogHeader>
            <DialogTitle className='text-base sm:text-lg text-foreground'>
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            mode='scheduled'
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanSelection} onOpenChange={setShowPlanSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Plano De Assinatura</DialogTitle>
          </DialogHeader>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='flex items-center gap-2'
                disabled={isLoading}>
                <span className='hidden sm:inline'>
                  {selectedPrice?.product?.name || 'Selecionar Plano'}
                </span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              {prices.map((price) => (
                <DropdownMenuItem
                  key={price.id}
                  onClick={() => setSelectedPrice(price)}
                  className={'flex items-center gap-2'}>
                  <Building2 size={16} />
                  <div className='flex-1'>
                    <div className='font-medium'>{price.product.name}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            disabled={!selectedPrice || planUrlLoading}
            onClick={() => handleGenerateUrl()}
            className='flex-1 bg-blue-100 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-1'>
            {planUrlLoading ? 'Gerando Url...' : 'Gerar URL do Cliente'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
