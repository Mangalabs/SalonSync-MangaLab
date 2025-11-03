import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'



import axios from '@/lib/axios'

const adjustmentSchema = z.object({
  // Dados do produto
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  brand: z.string().optional(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  costPrice: z.number().min(0, 'Preço de custo deve ser maior ou igual a 0').max(99999999.99, 'Preço de custo não pode exceder R$ 99.999.999,99'),
  salePrice: z.number().min(0, 'Preço de venda deve ser maior ou igual a 0').max(99999999.99, 'Preço de venda não pode exceder R$ 99.999.999,99'),
  minStock: z.number().min(0, 'Estoque mínimo deve ser maior ou igual a 0').max(999999999, 'Estoque mínimo não pode exceder 999.999.999 unidades'),
  // Ajuste de estoque
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0').max(999999999, 'Quantidade não pode exceder 999.999.999 unidades'),
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
      costPrice: product?.costPrice || undefined,
      salePrice: product?.salePrice || undefined,
      minStock: product?.minStock !== undefined ? Number(product.minStock) : 0,
      quantity: product?.currentStock || undefined,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome do Produto
          </label>
          <input
            {...register('name')}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Nome do produto"
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Categoria
          </label>
          <input
            {...register('category')}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Categoria do produto"
          />
          {errors.category && (
            <p className="text-xs text-destructive mt-1">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Marca (opcional)
          </label>
          <input
            {...register('brand')}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Marca do produto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Unidade
          </label>
          <select
            onChange={(e) => setValue('unit', e.target.value)}
            defaultValue={product?.unit}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          >
            <option value="">Selecione a unidade</option>
            <option value="un">Unidade (un)</option>
            <option value="kg">Quilograma (kg)</option>
            <option value="g">Grama (g)</option>
            <option value="l">Litro (l)</option>
            <option value="ml">Mililitro (ml)</option>
            <option value="m">Metro (m)</option>
            <option value="cm">Centímetro (cm)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Preço de Custo (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="99999999.99"
            {...register('costPrice', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? undefined : parseFloat(value) || undefined,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Digite o preço de custo"
          />
          {errors.costPrice && (
            <p className="text-xs text-destructive mt-1">{errors.costPrice.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Preço de Venda (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="99999999.99"
            {...register('salePrice', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? undefined : parseFloat(value) || undefined,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Digite o preço de venda"
          />
          {errors.salePrice && (
            <p className="text-xs text-destructive mt-1">{errors.salePrice.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Estoque Mínimo
          </label>
          <input
            type="number"
            min="0"
            max="999999999"
            {...register('minStock', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? undefined : parseInt(value, 10) || undefined,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Digite o estoque mínimo"
          />
          {errors.minStock && (
            <p className="text-xs text-destructive mt-1">{errors.minStock.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nova Quantidade em Estoque
          </label>
          <input
            type="number"
            min="0"
            max="999999999"
            {...register('quantity', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? undefined : parseInt(value, 10) || undefined,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder={`Quantidade atual: ${product.currentStock}`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Atual: {product.currentStock} {product.unit}
          </p>
          {errors.quantity && (
            <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Motivo da Alteração
        </label>
        <textarea
          {...register('reason')}
          rows={3}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground resize-none"
          placeholder="Descreva o motivo da alteração do produto e estoque"
        />
        {errors.reason && (
          <p className="text-xs text-destructive mt-1">{errors.reason.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Referência (opcional)
        </label>
        <input
          {...register('reference')}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          placeholder="Documento, nota, etc."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity cursor-pointer"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </form>
  )
}
