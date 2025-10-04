import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'

const formatPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return value
}

const createClientSchema = (isAdmin: boolean) => z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  ...(isAdmin && { branchId: z.string().min(1, 'Selecione uma filial') }),
})

type ClientFormData = {
  name: string;
  phone?: string;
  email?: string;
  branchId?: string;
};

export function ClientForm({
  onSuccess,
  initialData,
}: {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    branchId?: string;
  } | null;
}) {
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(createClientSchema(isAdmin)),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      branchId: !isAdmin ? activeBranch?.id : initialData?.branchId || undefined,
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        branchId: initialData.branchId || (!isAdmin ? activeBranch?.id : undefined),
      })
      
      if (isAdmin && initialData.branchId) {
        setValue('branchId', initialData.branchId)
      }
    }
  }, [initialData, activeBranch, isAdmin, reset, setValue])

  const selectedBranchId = watch('branchId')
  
  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
      }
      const branchIdToUse = selectedBranchId || data.branchId
      const headers = branchIdToUse ? { 'x-branch-id': branchIdToUse } : {}
      
      if (isEditing) {
        return axios.patch(`/api/clients/${initialData.id}`, payload, { headers })
      } else {
        return axios.post('/api/clients', payload, { headers })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      reset()
      onSuccess()
    },
  })

  const selectedBranchName = branches.find((branch: any) => branch.id === selectedBranchId)?.name

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6"
    >
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
          Nome
        </label>
        <input
          {...register('name')}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
          placeholder="Nome completo do cliente"
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Telefone
          </label>
          <input
            {...register('phone')}
            onChange={(e) => {
              const formatted = formatPhone(e.target.value)
              e.target.value = formatted
              setValue('phone', formatted)
            }}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email (opcional)
          </label>
          <input
            type="email"
            {...register('email')}
            className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            placeholder="email@exemplo.com"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity cursor-pointer"
      >
        {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Cliente' : 'Salvar Cliente'}
      </button>
    </form>
  )
}
