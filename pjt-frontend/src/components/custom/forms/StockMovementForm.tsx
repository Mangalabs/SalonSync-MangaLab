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
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  unitCost: z.number().optional(),
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
      quantity: initialData?.quantity || 0,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isAdmin && (
        <div>
          <Label htmlFor="branchId">Filial</Label>
          <Select 
            onValueChange={(value) => setValue('branchId', value)} 
            defaultValue={!isAdmin ? activeBranch?.id : (initialData ? activeBranch?.id : undefined)}
            disabled={isEditing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma filial" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch: any) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isEditing && (
            <p className="text-xs text-gray-500 mt-1">
              A filial não pode ser alterada durante a edição
            </p>
          )}
          {errors.branchId && (
            <p className="text-sm text-red-600 mt-1">{errors.branchId.message}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="productId">Produto</Label>
        <Select 
          key={`product-${initialData?.product.id || 'new'}-${products.length}`}
          onValueChange={(value) => setValue('productId', value)}
          value={watch('productId') || ''}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product: any) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} (Estoque: {product.currentStock})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.productId && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.productId.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="type">Tipo de Movimentação</Label>
        <Select 
          onValueChange={(value) => setValue('type', value as any)}
          defaultValue={initialData?.type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">Entrada</SelectItem>
            <SelectItem value="OUT">Saída</SelectItem>
            <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
            <SelectItem value="LOSS">Perda</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.type.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="quantity">Quantidade</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          {...register('quantity', { valueAsNumber: true })}
          placeholder="Digite a quantidade"
        />
        {errors.quantity && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.quantity.message}</p>
        )}
      </div>

      {(movementType === 'IN' || movementType === 'OUT') && (
        <div>
          <Label htmlFor="unitCost">Custo Unitário (R$)</Label>
          <Input
            id="unitCost"
            type="number"
            step="0.01"
            min="0"
            {...register('unitCost', { valueAsNumber: true })}
            placeholder="0,00"
          />
          <p className="text-xs text-[#737373] mt-1">
            {movementType === 'IN' ? 'Custo de compra do produto' : 'Valor de venda do produto'}
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="reason">Motivo</Label>
        <Textarea
          id="reason"
          {...register('reason')}
          placeholder="Descreva o motivo da movimentação"
          rows={3}
        />
        {errors.reason && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.reason.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="reference">Referência (opcional)</Label>
        <Input
          id="reference"
          {...register('reference')}
          placeholder="Nota fiscal, pedido, etc."
        />
      </div>

      {isAdmin && (
        <div>
          <Label htmlFor="soldById">Usuário Responsável (opcional)</Label>
          <Select 
            onValueChange={(value) => setValue('soldById', value === 'none' ? undefined : value)}
            defaultValue={initialData?.user?.id || 'none'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o usuário responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Admin (você)</SelectItem>
              {professionals.map((professional: any) => (
                <SelectItem key={professional.id} value={professional.id}>
                  {professional.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Deixe "Admin (você)" se você está fazendo a movimentação
          </p>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (isEditing ? 'Atualizando...' : 'Registrando...') : (isEditing ? 'Atualizar Movimentação' : 'Registrar Movimentação')}
      </Button>
    </form>
  )
}