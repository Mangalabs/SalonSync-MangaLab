import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'


const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  brand: z.string().optional().or(z.literal('')),
  costPrice: z.number().min(0, 'Preço de custo deve ser maior ou igual a 0').nullable().optional(),
  salePrice: z.number().min(0, 'Preço de venda deve ser maior ou igual a 0').nullable().optional(),
  initialStock: z.number().min(0, 'Quantidade inicial deve ser maior ou igual a 0').nullable().optional(),
  branchId: z.string().min(1, 'Selecione uma filial'),
})

const unitOptions = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'm', label: 'Metros (m)' },
  { value: 'cm', label: 'Centímetros (cm)' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'cx', label: 'Caixa (cx)' },
]

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  currentStock?: number;
}

export function ProductForm({ 
  onSuccess, 
  initialData, 
}: { 
  onSuccess: () => void;
  initialData?: Product | null;
}) {
  const isEditing = !!initialData
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const { isAdmin } = useUser()

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
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      category: initialData.category || 'Geral',
      brand: initialData.brand || '',
      unit: initialData.unit || 'un',
      costPrice: Number(initialData.costPrice) || 0,
      salePrice: Number(initialData.salePrice) || 0,
      initialStock: Number(initialData.currentStock) || 0,
      branchId: (initialData as any).branchId || (!isAdmin ? activeBranch?.id : undefined),
    } : {
      name: '',
      category: 'Geral',
      brand: '',
      unit: 'un',
      costPrice: 0,
      salePrice: 0,
      initialStock: 0,
      branchId: !isAdmin ? activeBranch?.id : undefined,
    },
  })

  const selectedUnit = watch('unit')

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = {
        ...data,
        costPrice: data.costPrice || 0,
        salePrice: data.salePrice || 0,
        initialStock: data.initialStock || 0,
        brand: data.brand || undefined,
      }
      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {}
      if (isEditing) {
        return axios.patch(`/api/products/${initialData.id}`, payload, { headers })
      } else {
        return axios.post('/api/products', payload, { headers })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', activeBranch?.id] })
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!')
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} produto`)
    
    },
  })

  const handleFormSubmit = (data: ProductFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {isAdmin && (
        <div>
          <Label htmlFor="branchId">Filial</Label>
          <Combobox
            options={branches.map((branch: any) => ({
              value: branch.id,
              label: branch.name,
            }))}
            value={watch('branchId')}
            onValueChange={(value) => setValue('branchId', value)}
            placeholder="Selecione uma filial"
            searchPlaceholder="Pesquisar filial..."
          />
          {errors.branchId && (
            <p className="text-sm text-red-600 mt-1">{errors.branchId.message}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="name">Nome do Produto</Label>
        <Input id="name" {...register('name')} placeholder="Ex: Shampoo Anticaspa" />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register('category')} placeholder="Ex: Cabelo, Barba, Pele" />
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" {...register('brand')} placeholder="Ex: L'Oréal, Pantene" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit">Unidade de Medida</Label>
          <Combobox
            options={unitOptions}
            value={watch('unit')}
            onValueChange={(value) => setValue('unit', value)}
            placeholder="Selecione a unidade"
            searchPlaceholder="Pesquisar unidade..."
          />
          {errors.unit && (
            <p className="text-sm text-red-500">{errors.unit.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="initialStock">Quantidade Inicial</Label>
          <Input 
            id="initialStock" 
            type="number" 
            min="0"
            {...register('initialStock', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? 0 : parseInt(value, 10) || 0,
            })} 
            placeholder="0" 
          />
          {errors.initialStock && (
            <p className="text-sm text-red-500">{errors.initialStock.message}</p>
          )}
          <p className="text-xs text-[#737373] mt-1">
            Quantidade em {selectedUnit || 'unidades'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
          <Input 
            id="costPrice" 
            type="number" 
            step="0.01" 
            min="0"
            {...register('costPrice', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? 0 : parseFloat(value) || 0,
            })} 
            placeholder="0,00" 
          />
          {errors.costPrice && (
            <p className="text-sm text-red-500">{errors.costPrice.message}</p>
          )}
          <p className="text-xs text-[#737373] mt-1">
            Quanto você paga pelo produto
          </p>
        </div>
        
        <div>
          <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
          <Input 
            id="salePrice" 
            type="number" 
            step="0.01" 
            min="0"
            {...register('salePrice', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? 0 : parseFloat(value) || 0,
            })} 
            placeholder="0,00" 
          />
          {errors.salePrice && (
            <p className="text-sm text-red-500">{errors.salePrice.message}</p>
          )}
          <p className="text-xs text-[#737373] mt-1">
            Preço usado nas vendas
          </p>
        </div>
      </div>
      
      <div className="bg-[#D4AF37]/10 p-3 rounded-md border border-[#D4AF37]/20">
        <p className="text-sm text-[#8B4513]">
          💡 <strong>Dica:</strong> {!isEditing ? 'O produto será criado com a quantidade inicial definida. ' : ''}Use os botões + e - na tabela de estoque para ajustes posteriores.
        </p>
      </div>
      
      <Button type="submit" disabled={mutation.isPending}>
        {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Produto' : 'Criar Produto'}
      </Button>
    </form>
  )
}