import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

import { RoleForm } from '../forms/RoleForm'

const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  roleId: z.string().min(1, 'Selecione uma função'),
  branchId: z.string().min(1, 'Selecione uma filial'),
  commissionRate: z.number().min(0).max(100).optional(),
  productCommissionRate: z.number().min(0).max(100).optional(),
})

const editProfessionalSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  roleId: z.string().min(1, 'Selecione uma função'),
  branchId: z.string().min(1, 'Selecione uma filial'),
  commissionRate: z.number().min(0).max(100).optional(),
  productCommissionRate: z.number().min(0).max(100).optional(),
})

type EmployeeFormData = z.infer<typeof createEmployeeSchema>
type EditProfessionalFormData = z.infer<typeof editProfessionalSchema>

const daysOfWeek = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

interface ProfessionalFormProps {
  onSuccess: () => void
  editingProfessional?: any
  branches: any[]
  roles: any[]
  refreshRoles: () => void
}

export function ProfessionalForm({
  onSuccess,
  editingProfessional,
  branches,
  roles,
  refreshRoles,
}: ProfessionalFormProps) {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const [selectedWorkingDays, setSelectedWorkingDays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ])
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [canManageOthers, setCanManageOthers] = useState(
    editingProfessional?.role === 'RECEPTIONIST'
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData | EditProfessionalFormData>({
    resolver: zodResolver(
      editingProfessional ? editProfessionalSchema : createEmployeeSchema
    ),
    defaultValues: {
      branchId: editingProfessional?.branchId || activeBranch?.id || '',
      name: editingProfessional?.name || '',
      roleId: editingProfessional?.customRole?.id || '',
      commissionRate: editingProfessional?.commissionRate || undefined,
      productCommissionRate:
        editingProfessional?.productCommissionRate || undefined,
    },
  })

  const createEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      if (editingProfessional) {
        const updateData = {
          name: data.name,
          roleId: data.roleId,
          workingDays: selectedWorkingDays,
          commissionRate: data.commissionRate,
          productCommissionRate: data.productCommissionRate,
        }
        await axios.patch(
          `/api/professionals/${editingProfessional.id}`,
          updateData
        )
      } else {
        const selectedRole = roles.find((role: any) => role.id === data.roleId)
        const employeeData = {
          ...data,
          role: selectedRole?.title || 'Profissional',
          commissionRate:
            data.commissionRate ?? selectedRole?.commissionRate ?? 0,
          productCommissionRate:
            data.productCommissionRate ??
            selectedRole?.productCommissionRate ??
            0,
          workingDays: selectedWorkingDays,
        }
        await axios.post('/api/auth/create-employee', employeeData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['professionals'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onSuccess()
    },
    onError: () => {},
  })

  const onSubmit = (data: EmployeeFormData) => {
    createEmployee.mutate({
      ...data,
      workingDays: selectedWorkingDays,
      canManageOthers,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>
          Nome Completo
        </label>
        <input
          {...register('name')}
          className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
          placeholder='Digite o nome completo'
        />
        {errors.name && (
          <p className='text-xs text-destructive mt-1'>{errors.name.message}</p>
        )}
      </div>

      {!editingProfessional && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Email
            </label>
            <input
              type='email'
              {...register('email')}
              className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
              placeholder='email@exemplo.com'
            />
            {errors.email && (
              <p className='text-xs text-destructive mt-1'>
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Senha
            </label>
            <input
              type='password'
              {...register('password')}
              className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
              placeholder='Mínimo 6 caracteres'
            />
            {errors.password && (
              <p className='text-xs text-destructive mt-1'>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Filial
          </label>
          <select
            value={watch('branchId') || ''}
            onChange={(e) => setValue('branchId', e.target.value)}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
            <option value=''>Selecione a filial</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.branchId && (
            <p className='text-xs text-destructive mt-1'>
              {errors.branchId.message}
            </p>
          )}
        </div>

        <div>
          <div className='flex justify-between items-center mb-2'>
            <label className='block text-sm font-medium text-foreground'>
              Função
            </label>
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type='button'
                  className='text-sm text-primary hover:opacity-80 font-medium flex items-center gap-1'>
                  <Plus className='w-4 h-4' />
                  Criar função
                </button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle>Nova Função</DialogTitle>
                </DialogHeader>
                <RoleForm
                  onSuccess={() => {
                    refreshRoles()
                    setIsRoleDialogOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <select
            value={watch('roleId') || ''}
            onChange={(e) => setValue('roleId', e.target.value)}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
            <option value=''>Selecione a função</option>
            {roles.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
          {errors.roleId && (
            <p className='text-xs text-destructive mt-1'>
              {errors.roleId.message}
            </p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Comissão de Serviços (%)
          </label>
          <input
            type='number'
            step='0.01'
            min='0'
            max='100'
            {...register('commissionRate', {
              valueAsNumber: true,
              setValueAs: (value) =>
                value === '' ? undefined : parseFloat(value) || undefined,
            })}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
            placeholder='Deixe vazio para usar taxa da função'
          />
          {errors.commissionRate && (
            <p className='text-xs text-destructive mt-1'>
              {errors.commissionRate.message}
            </p>
          )}
          <p className='text-xs text-muted-foreground mt-1'>
            Taxa personalizada para comissão de serviços
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            Comissão de Produtos (%)
          </label>
          <input
            type='number'
            step='0.01'
            min='0'
            max='100'
            {...register('productCommissionRate', {
              valueAsNumber: true,
              setValueAs: (value) =>
                value === '' ? undefined : parseFloat(value) || undefined,
            })}
            className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
            placeholder='Deixe vazio para usar taxa da função'
          />
          {errors.productCommissionRate && (
            <p className='text-xs text-destructive mt-1'>
              {errors.productCommissionRate.message}
            </p>
          )}
          <p className='text-xs text-muted-foreground mt-1'>
            Taxa personalizada para comissão de produtos
          </p>
        </div>
      </div>

      {!editingProfessional && (
        <div className='flex items-start space-x-3 p-4 bg-secondary/50 rounded-xl border border-border'>
          <input
            type='checkbox'
            id='canManageOthers'
            checked={canManageOthers}
            onChange={(e) => setCanManageOthers(e.target.checked)}
            className='mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-pointer'
          />
          <div className='flex-1'>
            <label
              htmlFor='canManageOthers'
              className='text-sm font-medium text-foreground cursor-pointer'>
              Permissões Administrativas
            </label>
            <p className='text-xs text-muted-foreground mt-1'>
              Este profissional poderá registrar atendimentos, fazer
              agendamentos e gerenciar movimentações no nome de outros
              profissionais. Ideal para recepcionistas.
            </p>
          </div>
        </div>
      )}

      <div>
        <label className='block text-sm font-medium text-foreground mb-3'>
          Dias de Trabalho
        </label>
        <div className='grid grid-cols-7 gap-3'>
          {daysOfWeek.map((day) => {
            const selected = selectedWorkingDays.includes(day.value)
            return (
              <div
                key={day.value}
                onClick={() => {
                  if (selected) {
                    setSelectedWorkingDays(
                      selectedWorkingDays.filter((d) => d !== day.value)
                    )
                  } else {
                    setSelectedWorkingDays(
                      [...selectedWorkingDays, day.value].sort((a, b) => a - b)
                    )
                  }
                }}
                className={`border rounded-xl p-3 cursor-pointer transition-all text-center ${
                  selected
                    ? 'border-primary bg-accent/20'
                    : 'border-border hover:border-primary hover:bg-accent/10'
                }`}>
                <div className='flex flex-col items-center space-y-1'>
                  <input
                    type='checkbox'
                    checked={selected}
                    onChange={() => {}}
                    className='w-4 h-4 text-primary rounded'
                  />
                  <span className='text-xs font-medium'>{day.short}</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className='text-xs text-muted-foreground mt-2'>
          Selecione os dias em que o profissional estará disponível
        </p>
      </div>

      <button
        type='submit'
        disabled={isSubmitting}
        className='w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity cursor-pointer'>
        {isSubmitting
          ? 'Salvando...'
          : editingProfessional
          ? 'Atualizar Profissional'
          : 'Criar Funcionário'}
      </button>
    </form>
  )
}
