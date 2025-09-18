import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
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

  // Categorias específicas para despesas fixas/recorrentes
  const recurringExpenseCategories = [
    { id: 'aluguel', name: 'Aluguel', color: '#EF4444' },
    { id: 'energia', name: 'Energia Elétrica', color: '#DC2626' },
    { id: 'agua', name: 'Água', color: '#B91C1C' },
    { id: 'internet', name: 'Internet/Telefone', color: '#991B1B' },
    { id: 'salarios-comissoes', name: 'Salários/Comissões', color: '#F97316' },
    { id: 'beneficios', name: 'Benefícios', color: '#C2410C' },
    { id: 'impostos', name: 'Impostos e Taxas', color: '#4B5563' },
    { id: 'seguros', name: 'Seguros', color: '#6B7280' },
    { id: 'manutencao', name: 'Manutenção Preventiva', color: '#374151' },
    { id: 'software', name: 'Software/Sistemas', color: '#1E3A8A' },
    { id: 'outras', name: 'Outras Despesas Fixas', color: '#6B7280' },
  ]

  const categories = recurringExpenseCategories



  const selectedCategoryId = watch('categoryId')
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId)
  const isSalaryCommissionCategory = selectedCategoryId === 'salarios-comissoes'
  const selectedProfessionalId = watch('professionalId')

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', selectedBranchId],
    queryFn: async () => {
      const headers = selectedBranchId ? { 'x-branch-id': selectedBranchId } : {}
      const res = await axios.get('/api/professionals', { headers })
      return res.data
    },
    enabled: !!selectedBranchId && isSalaryCommissionCategory,
  })

  // Buscar dados do profissional selecionado para cálculo automático
  const { data: professionalData } = useQuery({
    queryKey: ['professional-salary-data', selectedProfessionalId, selectedBranchId],
    queryFn: async () => {
      const headers = selectedBranchId ? { 'x-branch-id': selectedBranchId } : {}
      const res = await axios.get(`/api/professionals/${selectedProfessionalId}/salary-commission-data`, { headers })
      return res.data
    },
    enabled: !!selectedProfessionalId && !!selectedBranchId && isSalaryCommissionCategory,
  })

  // Definir valor automaticamente quando dados do profissional chegarem
  useEffect(() => {
    if (professionalData && isSalaryCommissionCategory) {
      setValue('fixedAmount', professionalData.totalEstimated)
    }
  }, [professionalData, isSalaryCommissionCategory, setValue])
  


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
          options={categories.map((category) => ({
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

      {isSalaryCommissionCategory && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="professionalId">Profissional</Label>
            <Combobox
              options={professionals.map((professional: any) => ({
                value: professional.id,
                label: professional.name,
              }))}
              value={selectedProfessionalId}
              onValueChange={(value) => {
                setValue('professionalId', value)
                // Limpar valor fixo para recalcular
                setValue('fixedAmount', undefined)
              }}
              placeholder="Selecione um profissional"
              searchPlaceholder="Pesquisar profissional..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Salário base + comissões do período
            </p>
          </div>

          {professionalData && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <h4 className="font-medium text-sm text-blue-900">Informações do Profissional</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Salário Base:</span>
                  <p className="font-medium">R$ {professionalData.baseSalary?.toFixed(2) || '0,00'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Comissões (mês atual):</span>
                  <p className="font-medium">R$ {professionalData.currentMonthCommissions?.toFixed(2) || '0,00'}</p>
                </div>
                <div className="col-span-2 pt-1 border-t border-blue-200">
                  <span className="text-gray-600">Total Estimado:</span>
                  <p className="font-semibold text-blue-900">R$ {professionalData.totalEstimated?.toFixed(2) || '0,00'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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