import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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

import { ProductForm } from './ProductForm'

interface SaleProduct {
  id: string
  name: string
  category: string
  brand?: string
  salePrice: number
  costPrice: number
  currentStock: number
  minStock: number
  unit: string
  productType: 'SALE'
  branchId?: string
}

const statusConfig = {
  low: 'bg-destructive/20 text-destructive',
  normal: 'bg-secondary/30 text-secondary-foreground',
  good: 'bg-primary/20 text-primary',
}

export function SaleProductTable() {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const [editingProduct, setEditingProduct] = useState<SaleProduct | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useQuery<SaleProduct[]>({
    queryKey: ['sale-products', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/products')
      return res.data.filter((product: any) => product.productType === 'SALE' || !product.productType)
    },
    enabled: !!activeBranch,
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-products', activeBranch?.id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeletingProductId(null)
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao excluir produto')
      setDeletingProductId(null)
    },
  })

  if (isLoading) {
    return <p className='p-4 text-muted-foreground'>Carregando produtos...</p>
  }
  if (error) {
    return <p className='p-4 text-destructive'>Erro ao carregar produtos</p>
  }
  if (!data?.length) {
    return <p className='p-4 text-muted-foreground'>Nenhum produto para venda encontrado</p>
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
          placeholder='Buscar produtos para venda...'
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
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Estoque</th>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Preço</th>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Status</th>
              <th className='py-3 px-4 text-left font-semibold text-foreground'>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const status =
                product.currentStock <= product.minStock
                  ? 'low'
                  : product.currentStock <= product.minStock * 2
                    ? 'normal'
                    : 'good'

              return (
                <tr
                  key={product.id}
                  className='border-b border-border hover:bg-muted/50 transition-colors md:table-row flex flex-col md:flex-row mb-4 md:mb-0 p-4 md:p-0 rounded-lg md:rounded-none'>
                  <td className='py-2 px-3 flex items-center space-x-3 md:table-cell block'>
                    <div className='w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0'>
                      <Package className='text-primary w-5 h-5' />
                    </div>
                    <div className='flex flex-col'>
                      <span className='font-medium text-foreground truncate'>{product.name}</span>
                    </div>
                  </td>

                  <td className='py-2 px-3 text-muted-foreground md:table-cell block'>
                    <span className='md:hidden font-semibold text-foreground'>Categoria: </span>
                    {product.category}
                  </td>

                  <td className='py-2 px-3 md:table-cell block'>
                    <span className='md:hidden font-semibold text-foreground'>Estoque: </span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusConfig[status]}`}>
                      {product.currentStock} {product.unit}
                    </span>
                  </td>

                  <td className='py-2 px-3 font-semibold text-foreground md:table-cell block'>
                    <span className='md:hidden font-semibold text-foreground'>Preço: </span>
                    R$ {Number(product.salePrice || 0).toFixed(2).replace('.', ',')}
                  </td>

                  <td className='py-2 px-3 md:table-cell block'>
                    <span className='md:hidden font-semibold text-foreground'>Status: </span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusConfig[status]}`}>
                      {status === 'low' ? 'Estoque Baixo' : status === 'normal' ? 'Atenção' : 'Em Estoque'}
                    </span>
                  </td>

                  <td className='py-2 px-3 md:table-cell block flex space-x-2 flex-wrap mt-2 md:mt-0'>
                    <Button
                      className='p-2 text-green-600 bg-green-200 hover:bg-green-100 rounded-lg transition-colors flex-1 md:flex-none cursor-pointer'
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
            <DialogTitle>Editar Produto - {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={editingProduct ? { ...editingProduct, branchId: activeBranch?.id } : null}
            onSuccess={() => setEditingProduct(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProductId} onOpenChange={() => setDeletingProductId(null)}>
        <AlertDialogContent className='max-w-[95vw] bg-card text-foreground'>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
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