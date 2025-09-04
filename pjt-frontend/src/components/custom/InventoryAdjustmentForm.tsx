import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

const adjustmentSchema = z.object({
  quantity: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Quantidade deve ser um número positivo' },
  ),
  reason: z.string().min(1, 'Motivo é obrigatório'),
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface Product {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
}

export function InventoryAdjustmentForm({ 
  product,
  type,
  onSuccess, 
}: { 
  product: Product;
  type: 'add' | 'remove';
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      quantity: '1',
      reason: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: AdjustmentFormData) => {
      // Map frontend type to backend enum
      const backendType = type === 'add' ? 'IN' : 'OUT'
      
      return axios.post(`/api/products/${product.id}/adjust`, {
        quantity: Number(data.quantity),
        type: backendType,
        reason: data.reason,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', activeBranch?.id] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements', activeBranch?.id] })
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div>
        <p className="font-medium">{product.name}</p>
        <p className="text-sm text-gray-500">Estoque atual: {product.currentStock} {product.unit}</p>
      </div>
      
      <div>
        <Label htmlFor="quantity">Quantidade</Label>
        <Input id="quantity" {...register('quantity')} type="number" min="1" />
        {errors.quantity && (
          <p className="text-sm text-red-500">{errors.quantity.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="reason">Motivo</Label>
        <Textarea id="reason" {...register('reason')} placeholder="Informe o motivo do ajuste" />
        {errors.reason && (
          <p className="text-sm text-red-500">{errors.reason.message}</p>
        )}
      </div>
      
      <Button type="submit" disabled={mutation.isPending} className={type === 'remove' ? 'bg-red-600 hover:bg-red-700' : ''}>
        {isSubmitting ? 'Salvando...' : (type === 'add' ? 'Adicionar ao Estoque' : 'Remover do Estoque')}
      </Button>
    </form>
  )
}