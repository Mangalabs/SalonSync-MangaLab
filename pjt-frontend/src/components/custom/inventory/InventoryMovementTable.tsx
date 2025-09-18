import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { StockMovementForm } from '../forms/StockMovementForm'

interface InventoryMovement {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'LOSS' | 'TRANSFER'
  quantity: number
  unitCost?: number
  totalCost?: number
  reason: string
  reference?: string
  createdAt: string
  product: { id: string; name: string }
  user?: { id: string; name: string }
}

interface Props {
  searchTerm: string
  filter: 'all' | 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'perda'
  dateRange: { start: string; end: string }
}

export function InventoryMovementTable({ searchTerm, filter, dateRange }: Props) {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()
  const [editingMovement, setEditingMovement] = useState<InventoryMovement | null>(null)
  const [deletingMovement, setDeletingMovement] = useState<InventoryMovement | null>(null)

  const deleteMovement = useMutation({
    mutationFn: async (movementId: string) => axios.delete(`/api/inventory/movements/${movementId}`),
    onSuccess: () => {
      toast.success('Movimentação excluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeletingMovement(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir movimentação')
    },
  })

  const { data, isLoading, error } = useQuery<InventoryMovement[]>({
    queryKey: ['inventory-movements', activeBranch?.id],
    queryFn: async () => {
      const params = activeBranch?.id ? `?branchId=${activeBranch.id}` : ''
      const res = await axios.get(`/api/inventory/movements${params}`)
      return res.data
    },
    enabled: !!activeBranch,
  })

  const filteredData = data?.filter(m => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      m.product.name.toLowerCase().includes(term) ||
      m.reason.toLowerCase().includes(term) ||
      (m.user?.name?.toLowerCase().includes(term) ?? false)

    const matchesType =
      filter === 'all'
        ? true
        : (filter === 'entrada' && m.type === 'IN') ||
        (filter === 'saida' && m.type === 'OUT') ||
        (filter === 'ajuste' && m.type === 'ADJUSTMENT') ||
        (filter === 'transferencia' && m.type === 'TRANSFER') ||
        (filter === 'perda' && m.type === 'LOSS')

    const movementDate = new Date(m.createdAt)
    const startDate = dateRange.start ? new Date(dateRange.start) : null
    const endDate = dateRange.end ? new Date(dateRange.end) : null

    const matchesDate =
      (!startDate || movementDate >= startDate) &&
      (!endDate || movementDate <= endDate)

    return matchesSearch && matchesType && matchesDate
  })

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'IN': return { label: 'Entrada', color: 'text-green-600 bg-green-100', icon: ArrowDown }
      case 'OUT': return { label: 'Saída', color: 'text-red-600 bg-red-100', icon: ArrowUp }
      case 'ADJUSTMENT': return { label: 'Ajuste', color: 'text-yellow-600 bg-yellow-100', icon: RefreshCw }
      case 'LOSS': return { label: 'Perda', color: 'text-orange-600 bg-orange-100', icon: RefreshCw }
      case 'TRANSFER': return { label: 'Transferência', color: 'text-blue-600 bg-blue-100', icon: RefreshCw }
      default: return { label: type, color: 'text-gray-600 bg-gray-100', icon: RefreshCw }
    }
  }

  if (isLoading) {return <p className="p-4">Carregando...</p>}
  if (error) {return <p className="p-4 text-red-500">Erro ao carregar movimentações</p>}

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {filteredData?.length ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Data/Hora</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Produto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Qtd</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor Unit.</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Motivo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuário</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((movement) => {
                const config = getTypeConfig(movement.type)
                const Icon = config.icon
                return (
                  <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-800">{new Date(movement.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 text-gray-800">{movement.product.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">{movement.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {movement.unitCost ? `R$ ${Number(movement.unitCost).toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {movement.totalCost ? `R$ ${Number(movement.totalCost).toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{movement.reason}</td>
                    <td className="py-3 px-4 text-gray-600">{movement.user?.name || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          className='p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors'
                          onClick={() => setEditingMovement(movement)}
                        >
                          <Edit className='w-4 h-4' />
                        </Button>
                        <Button
                          className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
                          onClick={() => setDeletingMovement(movement)}
                        >
                          <Trash2 className='w-4 h-4' />
                          
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma movimentação encontrada</h3>
            <p className="text-gray-500">Tente buscar com outro termo, período ou filtro de tipo.</p>
          </div>
        )}
      </div>

      <Dialog open={!!editingMovement} onOpenChange={() => setEditingMovement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          {editingMovement && (
            <StockMovementForm onSuccess={() => setEditingMovement(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita e irá afetar o estoque do produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingMovement && deleteMovement.mutate(deletingMovement.id)} disabled={deleteMovement.isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
