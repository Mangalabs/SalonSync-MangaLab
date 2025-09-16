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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

  const { data: clients, isLoading, error } = useQuery<Client[]>({
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
    return <p className="p-4">Carregando...</p>
  }

  if (error) {
    return <p className="p-4 text-red-500">Erro ao carregar clientes</p>
  }

  const handleSchedule = (client: Client) => {
    setSelectedClient(client)
    setShowForm(true)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients?.map((client) => (
          <div
            key={client.id}
            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{client.name}</h4>
                {client.phone && (
                  <p className="text-sm text-gray-500">{client.phone}</p>
                )}
                {client.email && (
                  <p className="text-sm text-gray-500">{client.email}</p>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Último atendimento: {client.lastVisit || '—'}
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(client)}
                className="flex-1 bg-purple-100 text-purple-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Editar
              </button>
              <button
                onClick={() => setDeletingClientId(client.id)}
                disabled={deleteClient.isPending}
                className="flex-1 bg-red-100 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Excluir
              </button>
              <button
                onClick={() => handleSchedule(client)}
                className="flex-1 bg-green-100 text-green-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
              >
                <Calendar className="w-3 h-3" />
                Agendar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-gray-500">
            Tente buscar com um termo diferente ou adicione um novo cliente.
          </p>
        </div>
      )}

      <AlertDialog
        open={!!deletingClientId}
        onOpenChange={() => setDeletingClientId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingClientId && deleteClient.mutate(deletingClientId)
              }
              disabled={deleteClient.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            mode="scheduled"
            client={selectedClient}
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
