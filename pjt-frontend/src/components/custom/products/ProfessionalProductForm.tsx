import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'

const professionalProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  brand: z.string().optional(),
  costPrice: z.number().min(0.01, 'Preço de custo deve ser maior que 0'),
  unitWeight: z.number().min(0.001, 'Peso/Volume deve ser maior que 0'),
  markupPercent: z.number().min(0, 'Markup deve ser maior ou igual a 0'),
  branchId: z.string().min(1, 'Selecione uma filial'),
})

const unitOptions = [
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'un', label: 'Unidade (un)' },
]

type ProfessionalProductFormData = z.infer<typeof professionalProductSchema>

interface ProfessionalProduct {
  id: string
  name: string
  category?: string
  brand?: string
  unit?: string
  costPrice?: number
  unitWeight?: number
  markupPercent?: number
}

export function ProfessionalProductForm({
  onSuccess,
  initialData,
}: {
  onSuccess: () => void
  initialData?: ProfessionalProduct | null
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
  } = useForm<ProfessionalProductFormData>({
    resolver: zodResolver(professionalProductSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          category: initialData.category || 'Cabelo',
          brand: initialData.brand || '',
          unit: initialData.unit || 'ml',
          costPrice: initialData.costPrice
            ? Number(initialData.costPrice)
            : undefined,
          unitWeight: initialData.unitWeight
            ? Number(initialData.unitWeight)
            : undefined,
          markupPercent: initialData.markupPercent
            ? Number(initialData.markupPercent)
            : 30,
          branchId:
            (initialData as any).branchId ||
            (!isAdmin ? activeBranch?.id : undefined),
        }
      : {
          name: '',
          category: 'Cabelo',
          brand: '',
          unit: 'ml',
          costPrice: undefined,
          unitWeight: undefined,
          markupPercent: 30,
          branchId: !isAdmin ? activeBranch?.id : undefined,
        },
  })

  const selectedUnit = watch('unit')
  const unitWeight = watch('unitWeight')
  const costPrice = watch('costPrice')
  const markupPercent = watch('markupPercent')

  const costPerUnit = unitWeight && costPrice ? costPrice / unitWeight : 0
  const costWithMarkup =
    costPerUnit && markupPercent ? costPerUnit * (1 + markupPercent / 100) : 0

  const mutation = useMutation({
    mutationFn: async (data: ProfessionalProductFormData) => {
      const payload = {
        ...data,
        productType: 'PROFESSIONAL_USE',
        salePrice: null,
        initialStock: 0,
        minStock: 0,
      }
      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {}
      if (isEditing) {
        return axios.patch(`/api/products/${initialData.id}`, payload, {
          headers,
        })
      } else {
        return axios.post('/api/products', payload, { headers })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({
        queryKey: ['products', activeBranch?.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['professional-products', activeBranch?.id],
      })
      queryClient.refetchQueries({
        queryKey: ['professional-products', activeBranch?.id],
      })
      toast.success(
        isEditing
          ? 'Produto profissional atualizado com sucesso!'
          : 'Produto profissional criado com sucesso!'
      )
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          `Erro ao ${isEditing ? 'atualizar' : 'criar'} produto profissional`
      )
    },
  })

  const handleFormSubmit = (data: ProfessionalProductFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
      {isAdmin && (
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Filial
          </label>
          <select
            value={watch('branchId') || ''}
            onChange={(e) => setValue('branchId', e.target.value)}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
            <option value=''>Selecione uma filial</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {errors.branchId && (
            <p className='text-xs text-destructive mt-1'>
              {errors.branchId.message}
            </p>
          )}
        </div>
      )}

      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>
          Nome do Produto
        </label>
        <input
          {...register('name')}
          className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
          placeholder='Ex: Shampoo Profissional'
        />
        {errors.name && (
          <p className='text-xs text-destructive mt-1'>{errors.name.message}</p>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Categoria
          </label>
          <input
            {...register('category')}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
            placeholder='Ex: Cabelo, Barba, Pele'
          />
          {errors.category && (
            <p className='text-xs text-destructive mt-1'>
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Marca
          </label>
          <input
            {...register('brand')}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
            placeholder="Ex: L'Oréal Professional"
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Unidade de Medida
          </label>
          <select
            value={watch('unit') || ''}
            onChange={(e) => setValue('unit', e.target.value)}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
            <option value=''>Selecione a unidade</option>
            {unitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.unit && (
            <p className='text-xs text-destructive mt-1'>
              {errors.unit.message}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Peso/Volume Total
          </label>
          <input
            type='number'
            step='0.001'
            min='0.001'
            {...register('unitWeight', { valueAsNumber: true })}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
            placeholder='Ex: 1000'
          />
          {errors.unitWeight && (
            <p className='text-xs text-destructive mt-1'>
              {errors.unitWeight.message}
            </p>
          )}
          <p className='text-xs text-muted-foreground mt-1'>
            Peso/volume total em {selectedUnit || 'unidades'}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Preço de Custo Total (R$)
          </label>
          <input
            type='number'
            step='0.01'
            min='0.01'
            {...register('costPrice', { valueAsNumber: true })}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
            placeholder='Digite o preço total'
          />
          {errors.costPrice && (
            <p className='text-xs text-destructive mt-1'>
              {errors.costPrice.message}
            </p>
          )}
          <p className='text-xs text-muted-foreground mt-1'>
            Custo total do produto
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Markup (%)
          </label>
          <input
            type='number'
            step='0.01'
            min='0'
            {...register('markupPercent', { valueAsNumber: true })}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
            placeholder='Ex: 30'
          />
          {errors.markupPercent && (
            <p className='text-xs text-destructive mt-1'>
              {errors.markupPercent.message}
            </p>
          )}
          <p className='text-xs text-muted-foreground mt-1'>
            Percentual de markup sobre o custo
          </p>
        </div>
      </div>

      {costPerUnit > 0 && (
        <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
          <h4 className='font-semibold text-blue-800 mb-2'>
            📊 Cálculo Automático
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-blue-600'>Custo por {selectedUnit}:</span>
              <span className='font-semibold ml-2'>
                R$ {costPerUnit.toFixed(4)}
              </span>
            </div>
            <div>
              <span className='text-blue-600'>
                Com markup ({markupPercent}%):
              </span>
              <span className='font-semibold ml-2'>
                R$ {costWithMarkup.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className='bg-purple-50 border border-purple-200 rounded-xl p-4'>
        <p className='text-sm text-purple-800'>
          💡 <strong>Produto Profissional:</strong> O custo será calculado
          automaticamente por unidade usada nas movimentações, aplicando o
          markup configurado.
        </p>
      </div>

      <button
        type='submit'
        disabled={mutation.isPending}
        className='w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-purple-700 transition-colors cursor-pointer'>
        {isSubmitting
          ? 'Salvando...'
          : isEditing
          ? 'Atualizar Produto Profissional'
          : 'Criar Produto Profissional'}
      </button>
    </form>
  )
}
