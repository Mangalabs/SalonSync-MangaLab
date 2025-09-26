import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { ProfessionalCommissionCard } from './ProfessionalCommissionCard'
import { RoleForm } from '../forms/RoleForm'

type Professional = {
  id: string
  name: string
  role: string
  commissionRate: number
  branchId: string
  customRole?: {
    title: string
    commissionRate: number
  }
  workingDays?: {
    dayOfWeek: number
    startTime: string
    endTime: string
    isActive: boolean
  }[]
}

const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  roleId: z.string().min(1, 'Selecione uma função'),
  branchId: z.string().min(1, 'Selecione uma filial'),
  workingDays: z.array(z.number()).optional(),
})

const editProfessionalSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().optional(),
  password: z.string().optional(),
  roleId: z.string().min(1, 'Selecione uma função'),
  branchId: z.string().min(1, 'Selecione uma filial'),
  workingDays: z.array(z.number()).optional(),
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

export function ProfessionalTable() {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const [expandedProfessional, setExpandedProfessional] = useState<
    string | null
  >(null)
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null)
  const [deletingProfessional, setDeletingProfessional] =
    useState<Professional | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<
    string | null
  >(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleSearchTerm, setRoleSearchTerm] = useState('')
  const [selectedWorkingDays, setSelectedWorkingDays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]) // Segunda a sexta por padrão

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', activeBranch?.id],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/professionals?include=workingDays')
        return res.data.filter(
          (p: Professional) => p.branchId === activeBranch?.id
        )
      } catch (error: any) {
        if (error.response?.status === 404) {
          return []
        }
        throw error
      }
    },
    enabled: !!activeBranch,
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
  })

  const { data: roles = [], refetch: refreshRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await axios.get('/api/roles')
      return res.data
    },
  })

  const deleteProfessional = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/professionals/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] })
      toast.success('Profissional excluído com sucesso!')
      setDeletingProfessional(null)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erro ao excluir profissional'
      )
      setDeletingProfessional(null)
    },
  })

  const createEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      if (editingProfessional) {
        // Editar profissional existente
        const updateData = {
          name: data.name,
          roleId: data.roleId,
          workingDays: selectedWorkingDays,
        }
        await axios.patch(
          `/api/professionals/${editingProfessional.id}`,
          updateData
        )
      } else {
        // Criar novo funcionário
        const selectedRole = roles.find((role: any) => role.id === data.roleId)
        const employeeData = {
          ...data,
          role: selectedRole?.title || 'Profissional',
          commissionRate: selectedRole?.commissionRate || 0,
          workingDays: selectedWorkingDays,
        }
        await axios.post('/api/auth/create-employee', employeeData)
      }
    },
    onSuccess: () => {
      toast.success(
        editingProfessional
          ? 'Profissional atualizado com sucesso!'
          : 'Funcionário criado com sucesso!'
      )
      reset()
      setCreatingNew(false)
      setEditingProfessional(null)
      setSelectedWorkingDays([1, 2, 3, 4, 5])
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['professionals'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          (editingProfessional
            ? 'Erro ao atualizar profissional'
            : 'Erro ao criar funcionário')
      )
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData | EditProfessionalFormData>({
    resolver: zodResolver(
      editingProfessional ? editProfessionalSchema : createEmployeeSchema
    ),
    defaultValues: { branchId: activeBranch?.id || '' },
  })

  const onSubmit = (data: EmployeeFormData) => {
    createEmployee.mutate({ ...data, workingDays: selectedWorkingDays })
  }

  const toggleExpanded = (id: string) =>
    setExpandedProfessional(expandedProfessional === id ? null : id)

  if (isLoading) {return <p>Carregando...</p>}
  const toggleWorkingDay = (dayValue: number) => {
    setSelectedWorkingDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort()
    )
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='p-6 border-b border-gray-100 flex justify-between items-center'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-10 w-40' />
          </div>
          <div className='bg-gray-50 px-6 py-4 border-b border-gray-100'>
            <div className='grid grid-cols-4 gap-4'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-16' />
            </div>
          </div>
          <div className='divide-y divide-gray-100'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className='px-6 py-4 grid grid-cols-4 gap-4 items-center'
              >
                <div className='flex items-center gap-3'>
                  <Skeleton className='w-10 h-10 rounded-full' />
                  <Skeleton className='h-5 w-32' />
                </div>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-12' />
                <div className='flex space-x-2'>
                  <Skeleton className='h-8 w-8' />
                  <Skeleton className='h-8 w-8' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const filteredProfessionals = professionals.filter(
    (prof) =>
      prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prof.customRole?.title || prof.role)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  )

  const filteredRoles = roles.filter((role: any) =>
    role.title.toLowerCase().includes(roleSearchTerm.toLowerCase())
  )

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4'>
        <Button
          className='w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/80 transition-colors'
          onClick={() => setCreatingNew(true)}>
          <PlusCircle className='w-4 h-4' />
          Novo Profissional
        </Button>

        <div className='flex items-center gap-2 w-full sm:w-64 bg-muted border border-border rounded-xl px-3 py-2 shadow-sm'>
          <Search className='w-4 h-4 text-muted-foreground' />
          <input
            type='text'
            placeholder='Buscar profissional...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full border-none outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground'
          />
        </div>
      </div>

      <div className='bg-card rounded-2xl shadow-sm border border-border overflow-hidden'>
        <div className='hidden md:grid bg-muted px-6 py-3 border-b border-border grid-cols-4 gap-4 font-semibold text-muted-foreground text-sm'>
          <div>Nome</div>
          <div>Função</div>
          <div>Comissão</div>
          <div>Ações</div>
        </div>

        <div className='divide-y divide-border'>
          {filteredProfessionals.length > 0 ? (
            filteredProfessionals.map((prof) => (
              <div key={prof.id}>
                <div
                  className={`px-4 sm:px-6 py-4 hover:bg-accent/10 transition-colors cursor-pointer 
                  grid grid-cols-1 md:grid-cols-4 gap-3 items-center 
                  ${selectedProfessional === prof.id ? 'bg-accent/20' : ''}`}
                  onClick={() => {
                    toggleExpanded(prof.id)
                    queryClient.invalidateQueries({
                      queryKey: ['monthly-commission', prof.id],
                    })
                    queryClient.invalidateQueries({
                      queryKey: ['daily-commission', prof.id],
                    })
                    queryClient.invalidateQueries({
                      queryKey: ['professional', prof.id],
                    })
                  }}>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold'>
                      {prof.name[0]}
                    </div>
                    <div className='flex-1'>
                      <div className='font-medium text-foreground truncate'>
                        {prof.name}
                      </div>
                    </div>
                    <div className='md:hidden ml-auto'>
                      {expandedProfessional === prof.id ? (
                        <ChevronUp className='w-5 h-5 text-muted-foreground' />
                      ) : (
                        <ChevronDown className='w-5 h-5 text-muted-foreground' />
                      )}
                    </div>
                  </div>

                  <div className='text-muted-foreground text-sm md:text-base'>
                    <span className='md:hidden font-semibold'>Função: </span>
                    {prof.customRole?.title || prof.role}
                  </div>

                  <div className='font-semibold text-primary text-sm md:text-base'>
                    <span className='md:hidden font-semibold'>Comissão: </span>
                    {prof.customRole?.commissionRate || prof.commissionRate}%
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      className='flex-1 md:flex-none p-2 text-green-600 bg-green-50 hover:bg-green-200 rounded-lg transition-colors cursor-pointer'
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingProfessional(prof)
                      }}>
                      <Edit className='w-4 h-4' />
                      <span className='md:hidden ml-1 text-sm'>Editar</span>
                    </Button>
                    <Button
                      className='flex-1 md:flex-none p-2 text-red-600 bg-red-50 hover:bg-red-200 rounded-lg transition-colors cursor-pointer'
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingProfessional(prof)
                      }}
                    >
                      <Trash2 className='w-4 h-4' />
                      <span className='md:hidden ml-1 text-sm'>Excluir</span>
                    </Button>
                  </div>

                  <div className='text-gray-700 text-sm md:text-base'>
                    <span className='md:hidden font-semibold'>Função: </span>
                    {prof.customRole?.title || prof.role}
                  </div>

                  <div className='font-semibold text-purple-600 text-sm md:text-base'>
                    <span className='md:hidden font-semibold'>Comissão: </span>
                    {prof.customRole?.commissionRate || prof.commissionRate}%
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      className='flex-1 md:flex-none p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors'
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingProfessional(prof)
                        // Preencher formulário com dados existentes
                        reset({
                          name: prof.name,
                          roleId: prof.customRole?.id || '',
                          branchId: prof.branchId,
                          email: '', // Não temos email no Professional
                          password: '', // Não mostrar senha existente
                        })
                        // Preencher dias de trabalho
                        const workingDays =
                          prof.workingDays
                            ?.filter((wd) => wd.isActive)
                            .map((wd) => wd.dayOfWeek) || []
                        setSelectedWorkingDays(workingDays)
                      }}
                    >
                      <Edit className='w-4 h-4' />
                      <span className='md:hidden ml-1 text-sm'>Editar</span>
                    </Button>
                    <Button
                      className='flex-1 md:flex-none p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingProfessional(prof)
                      }}
                    >
                      <Trash2 className='w-4 h-4' />
                      <span className='md:hidden ml-1 text-sm'>Excluir</span>
                    </Button>
                  </div>
                </div>

                {expandedProfessional === prof.id && (
                  <ProfessionalCommissionCard professionalId={prof.id} />
                )}
              </div>
            ))
          ) : (
            <div className='px-6 py-6 text-muted-foreground text-sm text-center'>
              Nenhum profissional encontrado
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!editingProfessional || creatingNew}
        onOpenChange={() => {
          setEditingProfessional(null)
          setCreatingNew(false)
          setSelectedWorkingDays([1, 2, 3, 4, 5])
        }}>
        <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto bg-card'>
          <DialogHeader>
            <DialogTitle>
              {creatingNew ? 'Novo Funcionário' : 'Editar Funcionário'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
            <div>
              <Label htmlFor='name'>Nome Completo</Label>
              <Input id='name' {...register('name')} />
              {errors.name && (
                <p className='text-xs text-destructive'>
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' {...register('email')} />
              {errors.email && (
                <p className='text-xs text-destructive'>
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor='password'>Senha</Label>
              <Input id='password' type='password' {...register('password')} />
              {errors.password && (
                <p className='text-xs text-destructive'>
                  {errors.password.message}
                </p>
              )}
            </div>
            {!editingProfessional && (
              <>
                <div>
                  <Label htmlFor='email'>Email</Label>
                  <Input id='email' type='email' {...register('email')} />
                  {errors.email && (
                    <p className='text-xs text-red-500'>
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor='password'>Senha</Label>
                  <Input
                    id='password'
                    type='password'
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className='text-xs text-red-500'>
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </>
            )}
            <div>
              <Label>Filial</Label>
              <Select
                onValueChange={(v) => setValue('branchId', v)}
                defaultValue={editingProfessional?.branchId || activeBranch?.id}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecione a filial' />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branchId && (
                <p className='text-xs text-destructive'>
                  {errors.branchId.message}
                </p>
              )}
            </div>
            <div>
              <Label>Função</Label>
              <Select
                onValueChange={(v) => setValue('roleId', v)}
                defaultValue={editingProfessional?.customRole?.id || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecione a função' />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className='text-xs text-red-500'>{errors.roleId.message}</p>
              )}
            </div>

            <div>
              <Label>Dias de Trabalho</Label>
              <div className='grid grid-cols-7 gap-1 mt-2'>
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type='button'
                    onClick={() => toggleWorkingDay(day.value)}
                    className={`p-2 text-xs rounded-lg border transition-colors ${
                      selectedWorkingDays.includes(day.value)
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                Selecione os dias em que o profissional estará disponível
              </p>
            </div>
            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting
                ? 'Salvando...'
                : editingProfessional
                ? 'Atualizar'
                : 'Criar Funcionário'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingProfessional}
        onOpenChange={() => setDeletingProfessional(null)}>
        <AlertDialogContent className='bg-card'>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground'>
              Tem certeza que deseja excluir "{deletingProfessional?.name}"?
              <br />
              <br />
              Esta ação não pode ser desfeita e irá:
              <br />• Remover o profissional do sistema
              <br />• Desativar despesas fixas relacionadas
              <br />• Remover acesso ao sistema (se houver)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/80'
              onClick={() =>
                deletingProfessional &&
                deleteProfessional.mutate(deletingProfessional.id)
              }>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4'>
        <Dialog
          open={roleOpen}
          onOpenChange={(open) => {
            setRoleOpen(open)
            if (!open) {
              setEditingRole(null)
            }
          }}>
          <DialogTrigger asChild>
            <Button
              variant='outline'
              className='border border-border hover:bg-accent/10 text-foreground flex items-center gap-2 px-4 py-2 rounded-xl transition-colors'>
              <Settings className='w-4 h-4' />
              Criar Função
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto bg-card'>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Editar Função' : 'Nova Função'}
              </DialogTitle>
            </DialogHeader>
            <RoleForm
              initialData={editingRole}
              onSuccess={() => {
                setRoleOpen(false)
                setEditingRole(null)
                refreshRoles()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      {roles.length > 0 && (
        <div className='bg-card rounded-2xl shadow-sm border border-border overflow-hidden mt-6'>
          <div className='flex justify-between items-center px-6 py-4 border-b border-border'>
            <h3 className='text-lg font-semibold text-foreground'>
              Funções Criadas
            </h3>
          </div>

          <div className='px-6 py-3 border-b border-border flex items-center gap-2'>
            <Search className='w-4 h-4 text-muted-foreground' />
            <input
              type='text'
              placeholder='Buscar função...'
              value={roleSearchTerm}
              onChange={(e) => setRoleSearchTerm(e.target.value)}
              className='w-full border-none outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground'
            />
          </div>

          <div
            className={`divide-y divide-border ${
              filteredRoles.length > 5 ? 'max-h-64 overflow-y-auto' : ''
            }`}>
            {filteredRoles.map((role: any) => (
              <div
                key={role.id}
                className='px-6 py-4 flex justify-between items-center hover:bg-accent/10 transition-colors'>
                <div>
                  <div className='font-medium text-foreground'>
                    {role.title}
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    {role.commissionRate > 0
                      ? `${role.commissionRate}% comissão`
                      : 'Sem comissão'}
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setEditingRole(role)
                    setRoleOpen(true)
                  }}
                  className='h-6 w-6 p-0 text-muted-foreground hover:text-foreground'>
                  <Edit className='h-3 w-3' />
                </Button>
              </div>
            ))}

            {filteredRoles.length === 0 && (
              <div className='px-6 py-4 text-muted-foreground text-sm text-center'>
                Nenhuma função encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
