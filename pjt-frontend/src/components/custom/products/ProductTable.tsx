import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useBranch } from '@/contexts/BranchContext'
import axios from '@/lib/axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

import { AdjustmentStockForm } from '../forms/AdjustmentStockForm'

interface Product {
  id: string
  name: string
  sku?: string
  description?: string
  category: string
  brand?: string
  salePrice: number
  costPrice: number
  currentStock: number
  minStock: number
  maxStock?: number
  unit: string
  isActive: boolean
}

const statusConfig = {
  low: 'bg-red-100 text-red-700',
  normal: 'bg-yellow-100 text-yellow-700',
  good: 'bg-green-100 text-green-700',
}

export function ProductTable() {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/products')
      return res.data
    },
    enabled: !!activeBranch,
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', activeBranch?.id] })
      setDeletingProductId(null)
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-alert
      alert(error.response?.data?.message || 'Erro ao excluir produto')
      setDeletingProductId(null)
    },
  })

  const handleAdjustment = (product: Product) => {
    setAdjustingProduct(product)
  }

  if (isLoading) {return <p className="p-4">Carregando...</p>}
  if (error) {return <p className="p-4 text-red-500">Erro ao carregar produtos</p>}
  if (!data?.length) {return <p className="p-4 text-gray-500">Nenhum produto encontrado</p>}

  const filteredProducts = data.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Produto</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Categoria</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Estoque</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Preço</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Status</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => {
              const status =
                product.currentStock <= product.minStock
                  ? 'low'
                  : product.currentStock <= product.minStock * 2
                    ? 'normal'
                    : 'good'

              return (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="text-purple-600 w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-800">{product.name}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{product.category}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusConfig[status]}`}>
                      {product.currentStock} {product.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    R$ {Number(product.salePrice).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusConfig[status]}`}>
                      {status === 'low' ? 'Estoque Baixo' : status === 'normal' ? 'Atenção' : 'Em Estoque'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdjustment(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingProductId(product.id)}
                        disabled={deleteProduct.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!adjustingProduct}
        onOpenChange={() => setAdjustingProduct(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto - {adjustingProduct?.name}</DialogTitle>
          </DialogHeader>
          <AdjustmentStockForm
            product={adjustingProduct}
            onSuccess={() => setAdjustingProduct(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingProductId}
        onOpenChange={() => setDeletingProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProductId && deleteProduct.mutate(deletingProductId)}
              disabled={deleteProduct.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
