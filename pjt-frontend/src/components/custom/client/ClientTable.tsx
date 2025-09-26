import { useState } from 'react'
import { Search, Edit, Calendar, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import axios from '@/lib/axios'
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
import { AppointmentForm } from '@/components/custom/appointment/AppointmentForm'

interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  branchId?: string
  lastVisit?: string
}

interface ClientTableProps {
  onEdit: (client: Client) => void
}

export function ClientTable({ onEdit }: ClientTableProps) {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

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
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <p className='p-4 text-center text-muted-foreground'>Carregando...</p>
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

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        {filteredClients?.map((client) => (
          <div
            key={client.id}
            className='border border-border rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1'
            style={{ backgroundColor: 'var(--color-card)' }}>
            <div className='flex items-center space-x-3 mb-4'>
              <div
                className='w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center'
                style={{ background: 'var(--color-accent)' }}>
                <span className='text-accent-foreground font-semibold text-base sm:text-lg'>
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className='flex-1 min-w-0'>
                <h4 className='font-semibold text-foreground truncate'>
                  {client.name}
                </h4>
                {client.phone && (
                  <p className='text-xs sm:text-sm text-muted-foreground truncate'>
                    {client.phone}
                  </p>
                )}
                {client.email && (
                  <p className='text-xs sm:text-sm text-muted-foreground truncate'>
                    {client.email}
                  </p>
                )}
              </div>
            </div>

            <p className='text-xs sm:text-sm text-muted-foreground mb-4'>
              Último atendimento: {client.lastVisit || '—'}
            </p>

            <div className='flex flex-col xs:flex-row sm:flex-row gap-2'>
              <button
                onClick={() => handleSchedule(client)}
                className='flex-1 bg-green-100 text-green-600 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-1 cursor-pointer'>
                <Calendar className='w-3 h-3' />
                Agendar
              </button>
              <button
                onClick={() => onEdit(client)}
                className='flex-1 bg-blue-100 text-blue-600 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer'>
                <Edit className='w-3 h-3' />
                Editar
              </button>
              <button
                onClick={() => setDeletingClientId(client.id)}
                disabled={deleteClient.isPending}
                className='flex-1 bg-red-100 text-red-600 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-1 cursor-pointer'>
                <Trash2 className='w-3 h-3' />
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients?.length === 0 && (
        <div className='text-center py-8 sm:py-12'>
          <div
            className='w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'
            style={{ backgroundColor: 'var(--color-popover)' }}>
            <Search className='w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground' />
          </div>
          <h3 className='text-base sm:text-lg font-medium text-foreground mb-2'>
            Nenhum cliente encontrado
          </h3>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Tente buscar com um termo diferente ou adicione um novo cliente.
          </p>
        </div>
      )}

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
            client={selectedClient}
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
