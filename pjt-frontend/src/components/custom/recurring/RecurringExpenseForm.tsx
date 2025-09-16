import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'

const recurringExpenseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  fixedAmount: z.union([z.number(), z.nan()]).optional(),
  receiptDay: z.number().min(1, 'Dia deve ser entre 1 e 31').max(31, 'Dia deve ser entre 1 e 31'),
  dueDay: z.number().min(1, 'Dia deve ser entre 1 e 31').max(31, 'Dia deve ser entre 1 e 31'),
  professionalId: z.string().optional(),
  branchId: z.string().min(1, 'Selecione uma filial'),
})

type RecurringExpenseFormData = z.infer<typeof recurringExpenseSchema>;

interface RecurringExpenseFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export function RecurringExpenseForm({ onSuccess, initialData }: RecurringExpenseFormProps) {
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
  } = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: initialData ? {
      name: initialData.name || '',
      description: initialData.description || '',
      categoryId: initialData.categoryId || '',
      fixedAmount: initialData.fixedAmount ? Number(initialData.fixedAmount) : undefined,
      receiptDay: initialData.receiptDay || 1,
      dueDay: initialData.dueDay || 1,
      professionalId: initialData.professionalId || '',
      branchId: initialData.branchId || (!isAdmin ? activeBranch?.id : undefined),
    } : {
      branchId: !isAdmin ? activeBranch?.id : undefined,
    },
  })

  const selectedBranchId = watch('branchId')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'EXPENSE', selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams({ type: 'EXPENSE' })
      if (selectedBranchId) {params.append('branchId', selectedBranchId)}
      const res = await axios.get(`/api/financial/categories?${params}`)
      return res.data
    },
    enabled: !!selectedBranchId,
  })



  const selectedCategoryId = watch('categoryId')
  
  const selectedCategory = categories.find((cat: any) => cat.id === selectedCategoryId)
  


  const createRecurringExpense = useMutation({
    mutationFn: async (data: RecurringExpenseFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        fixedAmount: isNaN(data.fixedAmount!) ? undefined : data.fixedAmount,
        receiptDay: data.receiptDay,
        dueDay: data.dueDay,
        professionalId: data.professionalId,
      }
      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {}
      
      if (initialData) {
        const res = await axios.put(`/api/financial/recurring-expenses/${initialData.id}`, payload, { headers })
        return res.data
      } else {
        const res = await axios.post('/api/financial/recurring-expenses', payload, { headers })
        return res.data
      }
    },
    onSuccess: () => {
      toast.success(initialData ? 'Despesa fixa atualizada com sucesso!' : 'Despesa fixa criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (initialData ? 'Erro ao atualizar despesa fixa' : 'Erro ao criar despesa fixa'))
    },
  })

  const onSubmit = (data: RecurringExpenseFormData) => {
    // Validar se dia de vencimento é após dia de recebimento
    if (data.receiptDay && data.dueDay && data.receiptDay > data.dueDay) {
      toast.error('O dia de vencimento deve ser após o dia de recebimento')
      return
    }
    createRecurringExpense.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Label htmlFor="name">Nome da Despesa</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ex: Conta de Luz, Aluguel, Plano de Saúde, etc."
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descrição adicional da despesa"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="categoryId">Categoria</Label>
        <Combobox
          options={categories.map((category: any) => ({
            value: category.id,
            label: category.name,
          }))}
          value={selectedCategoryId}
          onValueChange={(value) => setValue('categoryId', value)}
          placeholder="Selecione uma categoria"
          searchPlaceholder="Pesquisar categoria..."
        />
        {errors.categoryId && (
          <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
        )}

      </div>



      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="receiptDay">Dia de Recebimento</Label>
          <Combobox
            options={Array.from({ length: 31 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `Dia ${i + 1}`,
            }))}
            value={watch('receiptDay')?.toString()}
            onValueChange={(value) => setValue('receiptDay', parseInt(value))}
            placeholder="Dia do mês"
            searchPlaceholder="Pesquisar dia..."
          />
          {errors.receiptDay && (
            <p className="text-sm text-red-600 mt-1">{errors.receiptDay.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Dia do mês que a conta chega
          </p>
        </div>

        <div>
          <Label htmlFor="dueDay">Dia de Vencimento</Label>
          <Combobox
            options={Array.from({ length: 31 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `Dia ${i + 1}`,
            }))}
            value={watch('dueDay')?.toString()}
            onValueChange={(value) => setValue('dueDay', parseInt(value))}
            placeholder="Dia do mês"
            searchPlaceholder="Pesquisar dia..."
          />
          {errors.dueDay && (
            <p className="text-sm text-red-600 mt-1">{errors.dueDay.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Dia do mês do vencimento
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="fixedAmount">Valor Estimado (opcional)</Label>
        <Input
          id="fixedAmount"
          type="number"
          step="0.01"
          min="0"
          {...register('fixedAmount', { valueAsNumber: true })}
          placeholder="Valor estimado da despesa"
        />
        <p className="text-xs text-gray-500 mt-1">
          Valor estimado para controle. Deixe vazio se o valor varia muito.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (initialData ? 'Atualizando...' : 'Criando...') : (initialData ? 'Atualizar Despesa Fixa' : 'Criar Despesa Fixa')}
      </Button>
    </form>
  )
}