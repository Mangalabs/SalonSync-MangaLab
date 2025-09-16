import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Scissors, Sparkles, Heart, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'

import { ServiceForm } from './ServiceForm'

interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration?: string
  icon?: string
  color?: string
  branchId?: string
}

const getServiceIcon = (iconType?: string) => {
  switch (iconType) {
    case 'scissors':
      return <Scissors className="w-8 h-8 text-white" />
    case 'sparkles':
      return <Sparkles className="w-8 h-8 text-white" />
    case 'heart':
      return <Heart className="w-8 h-8 text-white" />
    default:
      return <Scissors className="w-8 h-8 text-white" />
  }
}

export function ServiceTable() {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const { isAdmin } = useUser()
  const [editingService, setEditingService] = useState<Service | null>(null)

  const { data: services, isLoading, error } = useQuery<Service[]>({
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
      queryClient.invalidateQueries({ queryKey: ['services', activeBranch?.id] })
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-alert
      alert(error.response?.data?.message || 'Erro ao excluir serviço')
    },
  })

  if (isLoading) {return <p>Carregando serviços...</p>}
  if (error) {return <p className="text-red-500">Erro ao carregar serviços</p>}

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Catálogo de Serviços</h3>
        <Dialog open={!!editingService && !editingService.id} onOpenChange={() => setEditingService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Serviço</DialogTitle>
            </DialogHeader>
            <ServiceForm onSuccess={() => setEditingService(null)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services && services.length > 0
          ? services.map((service) => (
            <div
              key={service.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`h-32 bg-gradient-to-br ${service.color || 'from-purple-400 to-pink-400'} flex items-center justify-center`}
              >
                {getServiceIcon(service.icon)}
              </div>
              <div className="p-6">
                <h4 className="font-semibold text-gray-800 mb-2">{service.name}</h4>
                {service.description && (
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                )}

                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-purple-600">
                    R$ {Number(service.price).toFixed(2).replace('.', ',')}
                  </span>
                  {service.duration && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {service.duration}
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <p className="text-xs mb-3">
                    <span
                      className={`px-2 py-1 rounded-full ${service.branchId ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {service.branchId ? 'Filial' : 'Global'}
                    </span>
                  </p>
                )}

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => setEditingService(service)}
                    className="flex-1 bg-purple-100 text-purple-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => deleteService.mutate(service.id)}
                    disabled={deleteService.isPending}
                    className="flex-1 bg-red-100 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
          : null}

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex items-center justify-center hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group cursor-pointer"
          onClick={() => setEditingService({ id: '', name: '', price: 0 })}
        >
          <div className="text-center">
            <PlusCircle className="w-12 h-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
            <h4 className="font-medium text-gray-600 group-hover:text-purple-600 mb-1">
              Adicionar Novo Serviço
            </h4>
            <p className="text-sm text-gray-500">
              Expanda seu catálogo com novos serviços
            </p>
          </div>
        </div>
      </div>

      <Dialog open={!!editingService && !!editingService.id} onOpenChange={() => setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          <ServiceForm
            initialData={
              editingService
                ? { ...editingService, price: String(editingService.price) }
                : undefined
            }
            onSuccess={() => setEditingService(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
