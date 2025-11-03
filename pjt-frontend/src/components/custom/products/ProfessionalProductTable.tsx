import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, Beaker, Activity } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useBranch } from '@/contexts/BranchContext'
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
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'

import { ProfessionalProductForm } from './ProfessionalProductForm'
import { ProfessionalMovementModal } from './ProfessionalMovementModal'

interface ProfessionalProduct {
  id: string
  name: string
  category: string
  brand?: string
  costPrice: number
  currentStock: number
  unitWeight: number
  markupPercent: number
  unit: string
  productType: 'PROFESSIONAL_USE'
  branchId?: string
}

export function ProfessionalProductTable() {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const [editingProduct, setEditingProduct] = useState<ProfessionalProduct | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [movementProduct, setMovementProduct] = useState<ProfessionalProduct | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useQuery<ProfessionalProduct[]>({
    queryKey: ['professional-products', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/products')
      return res.data.filter((product: any) => product.productType === 'PROFESSIONAL_USE')
    },
    enabled: !!activeBranch,
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-products', activeBranch?.id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeletingProductId(null)
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao excluir produto')
      setDeletingProductId(null)
    },
  })

  if (isLoading) {
    return <p className='p-4 text-muted-foreground'>Carregando produtos profissionais...</p>
  }
  if (error) {
    return <p className='p-4 text-destructive'>Erro ao carregar produtos profissionais</p>
  }
  if (!data?.length) {
    return <p className='p-4 text-muted-foreground'>Nenhum produto profissional encontrado</p>
  }

  const filteredProducts = data.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className='space-y-4'>
      <div className='flex mb-4'>
        <input
          type='text'
          placeholder='Buscar produtos profissionais...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base bg-input text-foreground'
        />
      </div>

      <div className='overflow-x-auto bg-card border border-border rounded-2xl shadow-sm'>
        <table className='min-w-full w-full table-auto border-collapse'>
          <thead className='hidden md:table-header-group'>
            <tr className='border-b border-border bg-muted'>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Produto</th>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Categoria</th>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Quantidade</th>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Custo/Unidade</th>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Status</th>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const costPerUnit = Number(product.costPrice) / Number(product.unitWeight)
              const costWithMarkup = costPerUnit * (1 + Number(product.markupPercent) / 100)

              return (
                <tr
                  key={product.id}
                  className='border-b border-border hover:bg-muted/50 transition-colors md:table-row flex flex-col md:flex-row mb-4 md:mb-0 p-4 md:p-0 rounded-lg md:rounded-none'>
                  <td className='py-2 px-3 flex items-center space-x-3 md:table-cell block'>
                    <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0'>
                      <Beaker className='text-purple-600 w-5 h-5' />
                    </div>
                    <div className='flex flex-col'>
                      <span className='font-medium text-foreground truncate'>{product.name}</span>
                    </div>
                  </td>

                  <td className='py-2 px-3 text-muted-foreground md:table-cell block'>
                    <span className='md:hidden font-semibold text-foreground'>Categoria: </span>
                    <div className='flex items-center gap-2'>
                      <span>{product.category}</span>
                      <span className='px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700'>
                        Profissional
                      </span>
                    </div>
                  </td>

                  <td className='py-2 px-3 md:table-cell block'>
                    <span className='md:hidden font-semibold text-foreground'>Quantidade: </span>
                    <span className='font-medium'>
                      {Number(product.currentStock || product.unitWeight).toFixed(3).replace(/\.?0+$/, '')} {product.unit}
                    </span>
                  </td>

                  <td className='py-2 px-3 font-semibold text-foreground md:table-cell block'>
                    <span className='md:hidden font-semibold text-foreground'>Custo/Unidade: </span>
                    <div className='flex flex-col'>
                      <span className='text-sm text-muted-foreground'>
                        Base: R$ {costPerUnit.toFixed(4)}/{product.unit}
                      </span>
                      <span className='font-semibold'>
                        +{product.markupPercent}%: R$ {costWithMarkup.toFixed(4)}/{product.unit}
                      </span>
                    </div>
                  </td>

                  <td className='py-2 px-3 md:table-cell block'>
                    <span className='md:hidden font-semibold text-foreground'>Status: </span>
                    <span className='px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700'>
                      Ativo
                    </span>
                  </td>

                  <td className='py-2 px-3 md:table-cell block flex space-x-2 flex-wrap mt-2 md:mt-0'>
                    <Button
                      className='p-2 text-blue-600 bg-blue-200 hover:bg-blue-100 rounded-lg transition-colors flex-1 md:flex-none cursor-pointer'
                      onClick={() => setMovementProduct(product)}
                      title='Registrar Movimentação'>
                      <Activity className='w-4 h-4' />
                    </Button>
                    <Button
                      className='p-2 text-purple-600 bg-purple-200 hover:bg-purple-100 rounded-lg transition-colors flex-1 md:flex-none cursor-pointer'
                      onClick={() => setEditingProduct(product)}>
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      className='p-2 text-red-600 bg-red-200 hover:bg-red-100 rounded-lg transition-colors flex-1 md:flex-none cursor-pointer'
                      onClick={() => setDeletingProductId(product.id)}
                      disabled={deleteProduct.isPending}>
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto bg-card'>
          <DialogHeader>
            <DialogTitle>Editar Produto Profissional - {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          <ProfessionalProductForm
            initialData={editingProduct ? { ...editingProduct, branchId: activeBranch?.id } : null}
            onSuccess={() => setEditingProduct(null)}
          />
        </DialogContent>
      </Dialog>

      <ProfessionalMovementModal
        isOpen={!!movementProduct}
        onClose={() => setMovementProduct(null)}
        product={movementProduct ? {
          id: movementProduct.id,
          name: movementProduct.name,
          currentStock: movementProduct.currentStock || movementProduct.unitWeight || 0,
          unit: movementProduct.unit
        } : { id: '', name: '', currentStock: 0, unit: '' }}
      />

      <AlertDialog open={!!deletingProductId} onOpenChange={() => setDeletingProductId(null)}>
        <AlertDialogContent className='max-w-[95vw] bg-card text-foreground'>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto profissional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex flex-col sm:flex-row sm:justify-end gap-2'>
            <AlertDialogCancel className='bg-muted text-foreground hover:bg-muted/80'>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/80'
              onClick={() => deletingProductId && deleteProduct.mutate(deletingProductId)}
              disabled={deleteProduct.isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}