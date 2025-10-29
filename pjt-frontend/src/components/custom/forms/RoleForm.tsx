import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'

const roleSchema = z.object({
  title: z.string().min(2, 'Título deve ter no mínimo 2 caracteres'),
  commissionRate: z.number().min(0).max(100).optional(),
  baseSalary: z.number().min(0, 'Salário deve ser maior ou igual a 0').max(99999999.99, 'Salário não pode exceder R$ 99.999.999,99').optional(),
  salaryPayDay: z.number().min(1, 'Dia deve ser entre 1 e 31').max(31, 'Dia deve ser entre 1 e 31').optional(),
  branchId: z.string().min(1, 'Selecione uma filial'),
})

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export function RoleForm({ onSuccess, initialData }: RoleFormProps) {
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
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      commissionRate: initialData.commissionRate || undefined,
      baseSalary: initialData.baseSalary || undefined,
      salaryPayDay: initialData.salaryPayDay || undefined,
      branchId: initialData.branchId || (!isAdmin ? activeBranch?.id : undefined),
    } : {
      commissionRate: undefined,
      branchId: !isAdmin ? activeBranch?.id : undefined,
    },
  })

  const createRole = useMutation({
    mutationFn: async (data: RoleFormData) => {
      try {
        const headers = data.branchId ? { 'x-branch-id': data.branchId } : {}
        if (initialData) {
          const res = await axios.patch(`/api/roles/${initialData.id}`, data, { headers })
          return res.data
        } else {
          const res = await axios.post('/api/roles', data, { headers })
          return res.data
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error('Rotas /api/roles não implementadas no backend. Consulte BACKEND_IMPLEMENTATION_PRIORITY.md')
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(initialData ? 'Função atualizada!' : 'Função criada!')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar função')
    },
  })

  const onSubmit = (data: RoleFormData) => {
    createRole.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          Título da Função
        </label>
        <input
          {...register('title')}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          placeholder="Ex: Barbeiro, Manicure, Gerente"
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Porcentagem de Comissão (%)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          {...register('commissionRate', { 
            valueAsNumber: true,
            setValueAs: (value) => value === '' ? undefined : parseFloat(value) || undefined,
          })}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          placeholder="Digite a porcentagem de comissão"
        />
        {errors.commissionRate && (
          <p className="text-xs text-destructive mt-1">{errors.commissionRate.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Deixe 0 se não houver comissão para esta função
        </p>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Configuração de Salário (Opcional)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Salário Base (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="99999999.99"
              {...register('baseSalary', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : parseFloat(value) || undefined,
              })}
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
              placeholder="Digite o salário base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Valor fixo mensal para esta função
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Dia do Pagamento
            </label>
            <input
              type="number"
              min="1"
              max="31"
              {...register('salaryPayDay', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : parseInt(value, 10) || undefined,
              })}
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
              placeholder="Digite o dia do pagamento"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dia do mês para gerar despesa
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity cursor-pointer"
      >
        {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Função' : 'Criar Função'}
      </button>
    </form>
  )
}