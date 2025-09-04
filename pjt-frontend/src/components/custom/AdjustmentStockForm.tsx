import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import axios from '@/lib/axios'

const adjustmentSchema = z.object({
  // Dados do produto
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  brand: z.string().optional(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  costPrice: z.number().min(0, 'Preço de custo deve ser maior ou igual a 0'),
  salePrice: z.number().min(0, 'Preço de venda deve ser maior ou igual a 0'),
  minStock: z.number().min(0, 'Estoque mínimo deve ser maior ou igual a 0'),
  // Ajuste de estoque
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  reason: z.string().min(1, 'Informe o motivo do ajuste'),
  reference: z.string().optional(),
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
}

interface AdjustmentStockFormProps {
  product: Product | null;
  onSuccess: () => void;
}

export function AdjustmentStockForm({
  product,
  onSuccess,
}: AdjustmentStockFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      name: product?.name || '',
      category: product?.category || '',
      brand: product?.brand || '',
      unit: product?.unit || 'un',
      costPrice: product?.costPrice || 0,
      salePrice: product?.salePrice || 0,
      minStock: product?.minStock || 0,
      quantity: product?.currentStock || 0,
      reason: 'Ajuste de produto e estoque',
    },
  })

  const createAdjustment = useMutation({
    mutationFn: async (data: AdjustmentFormData) => {
      // Primeiro atualiza os dados do produto
      await axios.patch(`/api/products/${product?.id}`, {
        name: data.name,
        category: data.category,
        brand: data.brand,
        unit: data.unit,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        minStock: data.minStock,
      })

      // Depois faz o ajuste de estoque
      const res = await axios.post(`/api/products/${product?.id}/adjust`, {
        type: 'ADJUSTMENT',
        quantity: data.quantity,
        reason: data.reason,
        reference: data.reference,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Produto e estoque atualizados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar produto')
    },
  })

  const onSubmit = (data: AdjustmentFormData) => {
    createAdjustment.mutate(data)
  }

  if (!product) {return null}

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Produto</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Nome do produto"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            {...register('category')}
            placeholder="Categoria do produto"
          />
          {errors.category && (
            <p className="text-sm text-red-600 mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="brand">Marca (opcional)</Label>
          <Input
            id="brand"
            {...register('brand')}
            placeholder="Marca do produto"
          />
        </div>

        <div>
          <Label htmlFor="unit">Unidade</Label>
          <Select
            onValueChange={(value) => setValue('unit', value)}
            defaultValue={product?.unit}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="un">Unidade (un)</SelectItem>
              <SelectItem value="kg">Quilograma (kg)</SelectItem>
              <SelectItem value="g">Grama (g)</SelectItem>
              <SelectItem value="l">Litro (l)</SelectItem>
              <SelectItem value="ml">Mililitro (ml)</SelectItem>
              <SelectItem value="m">Metro (m)</SelectItem>
              <SelectItem value="cm">Centímetro (cm)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            {...register('costPrice', { valueAsNumber: true })}
            placeholder="0,00"
          />
          {errors.costPrice && (
            <p className="text-sm text-red-600 mt-1">
              {errors.costPrice.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
          <Input
            id="salePrice"
            type="number"
            step="0.01"
            min="0"
            {...register('salePrice', { valueAsNumber: true })}
            placeholder="0,00"
          />
          {errors.salePrice && (
            <p className="text-sm text-red-600 mt-1">
              {errors.salePrice.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="minStock">Estoque Mínimo</Label>
          <Input
            id="minStock"
            type="number"
            min="0"
            {...register('minStock', { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.minStock && (
            <p className="text-sm text-red-600 mt-1">
              {errors.minStock.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="quantity">Nova Quantidade em Estoque</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            {...register('quantity', { valueAsNumber: true })}
            placeholder="Quantidade atual: {product.currentStock}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Atual: {product.currentStock} {product.unit}
          </p>
          {errors.quantity && (
            <p className="text-sm text-red-600 mt-1">
              {errors.quantity.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Motivo da Alteração</Label>
        <Textarea
          id="reason"
          {...register('reason')}
          placeholder="Descreva o motivo da alteração do produto e estoque"
          rows={3}
        />
        {errors.reason && (
          <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="reference">Referência (opcional)</Label>
        <Input
          id="reference"
          {...register('reference')}
          placeholder="Documento, nota, etc."
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </form>
  )
}
