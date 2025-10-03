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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Filial
          </label>
          <select
            value={watch('branchId') || ''}
            onChange={(e) => setValue('branchId', e.target.value)}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          >
            <option value="">Selecione uma filial</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {errors.branchId && (
            <p className="text-xs text-destructive mt-1">{errors.branchId.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Nome do Produto
        </label>
        <input
          {...register('name')}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          placeholder="Ex: Shampoo Anticaspa"
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Categoria
          </label>
          <input
            {...register('category')}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Ex: Cabelo, Barba, Pele"
          />
          {errors.category && (
            <p className="text-xs text-destructive mt-1">{errors.category.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Marca
          </label>
          <input
            {...register('brand')}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="Ex: L'Oréal, Pantene"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Unidade de Medida
          </label>
          <select
            value={watch('unit') || ''}
            onChange={(e) => setValue('unit', e.target.value)}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          >
            <option value="">Selecione a unidade</option>
            {unitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.unit && (
            <p className="text-xs text-destructive mt-1">{errors.unit.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Quantidade Inicial
          </label>
          <input
            type="number"
            min="0"
            {...register('initialStock', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? 0 : parseInt(value, 10) || 0,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="0"
          />
          {errors.initialStock && (
            <p className="text-xs text-destructive mt-1">{errors.initialStock.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Quantidade em {selectedUnit || 'unidades'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Preço de Custo (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('costPrice', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? 0 : parseFloat(value) || 0,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="0,00"
          />
          {errors.costPrice && (
            <p className="text-xs text-destructive mt-1">{errors.costPrice.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Quanto você paga pelo produto
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Preço de Venda (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('salePrice', { 
              valueAsNumber: true,
              setValueAs: (value) => value === '' ? 0 : parseFloat(value) || 0,
            })}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="0,00"
          />
          {errors.salePrice && (
            <p className="text-xs text-destructive mt-1">{errors.salePrice.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Preço usado nas vendas
          </p>
        </div>
      </div>
      
      <div className="bg-accent/20 border border-accent/30 rounded-xl p-4">
        <p className="text-sm text-foreground">
          💡 <strong>Dica:</strong> {!isEditing ? 'O produto será criado com a quantidade inicial definida. ' : ''}Use os botões + e - na tabela de estoque para ajustes posteriores.
        </p>
      </div>
      
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity cursor-pointer"
      >
        {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Produto' : 'Criar Produto'}
      </button>
    </form>
  )
}