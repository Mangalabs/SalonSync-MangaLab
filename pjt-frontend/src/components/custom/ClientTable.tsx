import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Edit } from 'lucide-react'
import { useState } from 'react'

import { ClientForm } from './ClientForm'

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
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  branchId?: string;
}

export function ClientTable() {
  const queryClient = useQueryClient()
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const { activeBranch } = useBranch()
  const { isAdmin } = useUser()

  const { data, isLoading, error } = useQuery<Client[]>({
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
      alert(error.response?.data?.message || 'Erro ao excluir cliente')
      setDeletingClientId(null)
    },
  })

  if (isLoading) {return <p className="p-4">Carregando...</p>}
  if (error) {return <p className="p-4 text-red-500">Erro ao carregar clientes</p>}
  if (!data?.length) {return <p className="p-4 text-gray-500">Nenhum cliente encontrado</p>}

  return (
    <div>
      <div className="border rounded-md divide-y">
        {data?.map((client) => (
          <div key={client.id} className="p-4 space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-lg">{client.name}</div>
                {client.phone && (
                  <div className="text-sm">Tel: {client.phone}</div>
                )}
                {client.email && (
                  <div className="text-sm">Email: {client.email}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingClient(client)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeletingClientId(client.id)}
                  disabled={deleteClient.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!editingClient}
        onOpenChange={() => setEditingClient(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            initialData={editingClient}
            onSuccess={() => setEditingClient(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingClientId}
        onOpenChange={() => setDeletingClientId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingClientId && deleteClient.mutate(deletingClientId)}
              disabled={deleteClient.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
