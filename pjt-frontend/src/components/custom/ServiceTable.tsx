import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Edit } from 'lucide-react'
import { useState } from 'react'

import { ServiceForm } from './ServiceForm'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'

export function ServiceTable() {
  const queryClient = useQueryClient()
  const [editingService, setEditingService] = useState<any>(null)
  const { activeBranch } = useBranch()
  const { isAdmin } = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['services', activeBranch?.id],
    queryFn: async () => {
      const params = activeBranch?.id ? `?branchId=${activeBranch.id}` : ''
      const res = await axios.get(`/api/services${params}`)
      return res.data
    },
    enabled: !!activeBranch,
  })

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/services/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao excluir serviço')
    },
  })

  if (isLoading) {return <p>Carregando serviços...</p>}
  if (!Array.isArray(data)) {return <p>Nenhum serviço encontrado.</p>}

  return (
    <div>
      <div className="border rounded-md p-2 md:p-4 bg-white overflow-x-auto">
        <table className="w-full text-xs md:text-sm min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 text-left">Nome</th>
              <th className="py-2 text-right">Preço</th>
              {isAdmin && <th className="py-2 text-center mobile-hidden">Escopo</th>}
              <th className="py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((service: any) => (
              <tr key={service.id} className="border-t">
                <td className="py-2 font-medium">{service.name}</td>
                <td className="py-2 text-right font-semibold">R$ {Number(service.price).toFixed(2)}</td>
                {isAdmin && (
                  <td className="py-2 text-center mobile-hidden">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.branchId ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {service.branchId ? 'Filial' : 'Global'}
                    </span>
                  </td>
                )}
                <td className="py-2">
                  <div className="flex gap-1 md:gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingService(service)}
                      className="p-2"
                    >
                      <Edit size={12} className="md:w-4 md:h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteService.mutate(service.id)}
                      disabled={deleteService.isPending}
                      className="p-2"
                    >
                      <Trash2 size={12} className="md:w-4 md:h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!editingService}
        onOpenChange={() => setEditingService(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          <ServiceForm
            initialData={editingService}
            onSuccess={() => setEditingService(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
