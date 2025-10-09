import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'



const movementSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'LOSS']),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0').max(999999999, 'Quantidade não pode exceder 999.999.999 unidades'),
  unitCost: z.number().min(0, 'Valor deve ser maior ou igual a 0').max(99999999.99, 'Valor não pode exceder R$ 99.999.999,99').optional(),
  reason: z.string().min(1, 'Informe o motivo'),
  reference: z.string().optional(),
  branchId: z.string().min(1, 'Selecione uma filial'),
  soldById: z.string().optional(),
})

type MovementFormData = z.infer<typeof movementSchema>;

interface StockMovementFormProps {
  onSuccess: () => void;
  initialData?: InventoryMovement;
}

interface InventoryMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'LOSS';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  reference?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

export function StockMovementForm({ onSuccess, initialData }: StockMovementFormProps) {
  const isEditing = !!initialData
  const queryClient = useQueryClient()
  const { isAdmin } = useUser()
  const { activeBranch } = useBranch()

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
    enabled: isAdmin,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      branchId: !isAdmin ? activeBranch?.id : (initialData ? activeBranch?.id : undefined),
      productId: initialData?.product.id || '',
      type: initialData?.type || undefined,
      quantity: initialData?.quantity || undefined,
      unitCost: initialData?.unitCost || undefined,
      reason: initialData?.reason || '',
      reference: initialData?.reference || '',
    },
  })

  const selectedBranchId = watch('branchId')

  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) {return []}
      const res = await axios.get(`/api/products?branchId=${selectedBranchId}`)
      return res.data
    },
    enabled: !!selectedBranchId,
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) {return []}
      const res = await axios.get(`/api/professionals?branchId=${selectedBranchId}`)
      return res.data
    },
    enabled: !!selectedBranchId && isAdmin,
  })

  const movementType = watch('type')

  useEffect(() => {
    if (initialData && isEditing) {
      setValue('productId', initialData.product.id)
      setValue('type', initialData.type)
      setValue('quantity', initialData.quantity)
      setValue('unitCost', initialData.unitCost || undefined)
      setValue('reason', initialData.reason)
      setValue('reference', initialData.reference || '')
      setValue('soldById', initialData.user?.id || undefined)
    }
  }, [initialData, isEditing, setValue])

  useEffect(() => {
    if (initialData && isEditing && products.length > 0) {
      const productExists = products.find(p => p.id === initialData.product.id)

      
      if (productExists) {
        setValue('productId', initialData.product.id)
      }
    }
  }, [initialData, isEditing, products, setValue, watch])

  const createMovement = useMutation({
    mutationFn: async (data: MovementFormData) => {
      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {}
      const payload = {
        ...(isEditing && { productId: data.productId }),
        type: data.type,
        quantity: data.quantity,
        unitCost: data.unitCost,
        reason: data.reason,
        reference: data.reference,
        soldById: data.soldById,
      }
      
      if (isEditing) {
        const res = await axios.patch(`/api/inventory/movements/${initialData!.id}`, payload, { headers })
        return res.data
      } else {
        const res = await axios.post(`/api/products/${data.productId}/adjust`, payload, { headers })
        return res.data
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Movimentação atualizada com sucesso!' : 'Movimentação registrada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (isEditing ? 'Erro ao atualizar movimentação' : 'Erro ao registrar movimentação'))
    },
  })

  const onSubmit = (data: MovementFormData) => {
    createMovement.mutate(data)
  }



  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Filial
          </label>
          <select
            value={!isAdmin ? activeBranch?.id : (initialData ? activeBranch?.id : watch('branchId') || '')}
            onChange={(e) => setValue('branchId', e.target.value)}
            disabled={isEditing}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground disabled:opacity-50"
          >
            <option value="">Selecione uma filial</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {isEditing && (
            <p className="text-xs text-muted-foreground mt-1">
              A filial não pode ser alterada durante a edição
            </p>
          )}
          {errors.branchId && (
            <p className="text-xs text-destructive mt-1">{errors.branchId.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Produto
        </label>
        <select
          value={watch('productId') || ''}
          onChange={(e) => setValue('productId', e.target.value)}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
        >
          <option value="">Selecione um produto</option>
          {products.map((product: any) => (
            <option key={product.id} value={product.id}>
              {product.name} (Estoque: {product.currentStock})
            </option>
          ))}
        </select>
        {errors.productId && (
          <p className="text-xs text-destructive mt-1">{errors.productId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tipo de Movimentação
          </label>
          <select
            value={watch('type') || ''}
            onChange={(e) => setValue('type', e.target.value as any)}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          >
            <option value="">Selecione o tipo</option>
            <option value="IN">Entrada</option>
            <option value="OUT">Saída</option>
            <option value="ADJUSTMENT">Ajuste</option>
            <option value="LOSS">Perda</option>
          </select>
          {errors.type && (
            <p className="text-xs text-destructive mt-1">{errors.type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Quantidade
          </label>
          <input
            type="number"
            min="1"
            max="999999999"
            {...register('quantity', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? undefined : parseInt(value, 10) || undefined,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Digite a quantidade"
          />
          {errors.quantity && (
            <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      {(movementType === 'IN' || movementType === 'OUT') && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Custo Unitário (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="99999999.99"
            {...register('unitCost', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? undefined : parseFloat(value) || undefined,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="0,00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {movementType === 'IN' ? 'Custo de compra do produto' : 'Valor de venda do produto'} (máx: R$ 99.999.999,99)
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Motivo
        </label>
        <textarea
          {...register('reason')}
          rows={3}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground resize-none"
          placeholder="Descreva o motivo da movimentação"
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
          placeholder="Nota fiscal, pedido, etc."
        />
      </div>

      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Usuário Responsável (opcional)
          </label>
          <select
            value={initialData?.user?.id || 'none'}
            onChange={(e) => setValue('soldById', e.target.value === 'none' ? undefined : e.target.value)}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          >
            <option value="none">Admin (você)</option>
            {professionals.map((professional: any) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Deixe "Admin (você)" se você está fazendo a movimentação
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity cursor-pointer"
      >
        {isSubmitting ? (isEditing ? 'Atualizando...' : 'Registrando...') : (isEditing ? 'Atualizar Movimentação' : 'Registrar Movimentação')}
      </button>
    </form>
  )
}