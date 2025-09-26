import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
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

export function InventoryMovementTable({
  searchTerm,
  filter,
  dateRange,
}: Props) {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()
  const [editingMovement, setEditingMovement] =
    useState<InventoryMovement | null>(null)
  const [deletingMovement, setDeletingMovement] =
    useState<InventoryMovement | null>(null)

  const deleteMovement = useMutation({
    mutationFn: async (movementId: string) =>
      axios.delete(`/api/inventory/movements/${movementId}`),
    onSuccess: () => {
      toast.success('Movimentação excluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeletingMovement(null)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erro ao excluir movimentação',
      )
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

  const filteredData = data?.filter((m) => {
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
    const base = {
      color: 'bg-accent text-accent-foreground',
      icon: RefreshCw,
    }

    switch (type) {
      case 'IN':
        return { label: 'Entrada', ...base, icon: ArrowDown }
      case 'OUT':
        return { label: 'Saída', ...base, icon: ArrowUp }
      case 'ADJUSTMENT':
        return { label: 'Ajuste', ...base }
      case 'LOSS':
        return { label: 'Perda', ...base }
      case 'TRANSFER':
        return { label: 'Transferência', ...base }
      default:
        return { label: type, ...base }
    }
  }

  if (isLoading) {
    return (
      <p className='p-4 text-center text-muted-foreground'>Carregando...</p>
    )
  }
  if (error) {
    return (
      <p className='p-4 text-center text-destructive'>
        Erro ao carregar movimentações
      </p>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border'>
        {filteredData?.length ? (
          <table className='min-w-full w-full border-collapse'>
            <thead className='hidden md:table-header-group'>
              <tr className='border-b border-border bg-muted'>
                <th className='py-3 px-4 text-left font-semibold text-foreground'>
                  Data/Hora
                </th>
                <th className='py-3 px-4 text-left font-semibold text-foreground'>
                  Produto
                </th>
                <th className='py-3 px-4 text-left font-semibold text-foreground'>
                  Tipo
                </th>
                <th className='py-3 px-4 text-right font-semibold text-foreground'>
                  Qtd
                </th>
                <th className='py-3 px-4 text-right font-semibold text-foreground'>
                  Valor Unit.
                </th>
                <th className='py-3 px-4 text-right font-semibold text-foreground'>
                  Total
                </th>
                <th className='py-3 px-4 text-left font-semibold text-foreground'>
                  Motivo
                </th>
                <th className='py-3 px-4 text-left font-semibold text-foreground'>
                  Usuário
                </th>
                <th className='py-3 px-4 text-center font-semibold text-foreground'>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((movement) => {
                const config = getTypeConfig(movement.type)
                const Icon = config.icon

                return (
                  <tr
                    key={movement.id}
                    className='border-b border-border hover:bg-muted transition-colors md:table-row block md:border-0 md:hover:bg-transparent mb-4 md:mb-0 rounded-lg md:rounded-none'>
                    <td className='py-2 px-3 md:table-cell block'>
                      <span className='md:hidden font-semibold'>
                        Data/Hora:{' '}
                      </span>
                      {new Date(movement.createdAt).toLocaleString('pt-BR')}
                    </td>

                    <td className='py-2 px-3 md:table-cell block'>
                      <span className='md:hidden font-semibold'>Produto: </span>
                      {movement.product.name}
                    </td>

                    <td className='py-2 px-3 md:table-cell block'>
                      <span className='md:hidden font-semibold'>Tipo: </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${config.color}`}>
                        <Icon className='w-3 h-3 mr-1' />
                        {config.label}
                      </span>
                    </td>

                    <td className='py-2 px-3 text-right md:table-cell block'>
                      <span className='md:hidden font-semibold'>Qtd: </span>
                      {movement.quantity}
                    </td>

                    <td className='py-2 px-3 text-right md:table-cell block'>
                      <span className='md:hidden font-semibold'>
                        Valor Unit.:{' '}
                      </span>
                      {movement.unitCost
                        ? `R$ ${Number(movement.unitCost).toFixed(2)}`
                        : '-'}
                    </td>

                    <td className='py-2 px-3 text-right md:table-cell block'>
                      <span className='md:hidden font-semibold'>Total: </span>
                      {movement.totalCost
                        ? `R$ ${Number(movement.totalCost).toFixed(2)}`
                        : '-'}
                    </td>

                    <td className='py-2 px-3 md:table-cell block'>
                      <span className='md:hidden font-semibold'>Motivo: </span>
                      {movement.reason}
                    </td>

                    <td className='py-2 px-3 md:table-cell block'>
                      <span className='md:hidden font-semibold'>Usuário: </span>
                      {movement.user?.name || '-'}
                    </td>

                    <td className='py-2 px-3 md:table-cell block flex space-x-2 mt-2 md:mt-0'>
                      <Button
                        className='p-2 text-green-600 bg-green-200 hover:bg-green-100 rounded-lg transition-colors flex-1 md:flex-none cursor-pointer'
                        onClick={() => setEditingMovement(movement)}>
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button
                        className='p-2 text-red-600 bg-red-200 hover:bg-red-100 rounded-lg transition-colors flex-1 md:flex-none cursor-pointer'
                        onClick={() => setDeletingMovement(movement)}>
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4'>
              <RefreshCw className='w-8 h-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-medium text-foreground mb-2'>
              Nenhuma movimentação encontrada
            </h3>
            <p className='text-muted-foreground'>
              Tente buscar com outro termo, período ou filtro de tipo.
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={!!editingMovement}
        onOpenChange={() => setEditingMovement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          {editingMovement && (
            <StockMovementForm onSuccess={() => setEditingMovement(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingMovement}
        onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não
              pode ser desfeita e irá afetar o estoque do produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingMovement && deleteMovement.mutate(deletingMovement.id)
              }
              disabled={deleteMovement.isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
