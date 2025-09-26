import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Building,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Search as SearchIcon,
} from 'lucide-react'

import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const branchSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  address: z.string().optional(),
  phone: z.string().optional(),
})

type BranchFormData = z.infer<typeof branchSchema>

interface Branch {
  id: string
  name: string
  address?: string
  phone?: string
  isActive: boolean
  manager?: string
}

export function BranchManagement() {
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
  })

  const createBranch = useMutation({
    mutationFn: async (data: BranchFormData) => {
      if (editingBranch) {
        await axios.patch(`/api/branches/${editingBranch.id}`, data)
      } else {
        await axios.post('/api/branches', data)
      }
    },
    onSuccess: () => {
      toast.success(editingBranch ? 'Filial atualizada!' : 'Filial criada!')
      reset()
      setShowAddBranch(false)
      setEditingBranch(null)
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar filial')
    },
  })

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/branches/${id}`)
    },
    onSuccess: () => {
      toast.success('Filial removida!')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover filial')
    },
  })

  const onSubmit = (data: BranchFormData) => createBranch.mutate(data)

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    reset({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
    })
    setShowAddBranch(true)
  }

  const handleNew = () => {
    setEditingBranch(null)
    reset()
    setShowAddBranch(true)
  }

  const filteredBranches = useMemo(
    () =>
      branches.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [branches, search],
  )

  if (isLoading) {
    return <div className='text-muted-foreground'>Carregando filiais...</div>
  }

  return (
    <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
          <MapPin className='w-5 h-5 text-muted-foreground' />
          Filiais
        </h3>

        <Dialog open={showAddBranch} onOpenChange={setShowAddBranch}>
          <DialogTrigger asChild>
            <button
              onClick={handleNew}
              className='bg-primary text-primary-foreground py-2 px-4 rounded-xl font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer'>
              <Plus className='w-4 h-4' />
              Nova Filial
            </button>
          </DialogTrigger>
          <DialogContent className='bg-card text-foreground border border-border'>
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? 'Editar Filial' : 'Adicionar Nova Filial'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div>
                <Label htmlFor='name'>Nome da Filial</Label>
                <Input id='name' {...register('name')} />
                {errors.name && (
                  <p className='text-sm text-destructive'>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='address'>Endereço</Label>
                <Input id='address' {...register('address')} />
                {errors.address && (
                  <p className='text-sm text-destructive'>
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='phone'>Telefone</Label>
                <Input id='phone' {...register('phone')} />
                {errors.phone && (
                  <p className='text-sm text-destructive'>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className='flex justify-end gap-3 mt-4'>
                <button
                  type='button'
                  onClick={() => setShowAddBranch(false)}
                  className='px-4 py-2 border border-border text-muted-foreground rounded-xl font-medium hover:bg-muted'>
                  Cancelar
                </button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Salvando...'
                    : editingBranch
                      ? 'Atualizar'
                      : 'Salvar Filial'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='mb-4'>
        <div className='relative'>
          <Input
            placeholder='Buscar filiais...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SearchIcon className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground' />
        </div>
      </div>

      <div
        className={`space-y-4 ${
          filteredBranches.length > 5 ? 'max-h-[400px] overflow-y-auto' : ''
        }`}>
        {filteredBranches.map((branch) => (
          <div
            key={branch.id}
            className='border border-border rounded-xl p-4 hover:shadow-md hover:bg-muted transition-colors'>
            <div className='flex items-start justify-between'>
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-muted rounded-xl flex items-center justify-center'>
                  <Building className='w-6 h-6 text-primary' />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='font-semibold text-foreground'>
                      {branch.name}
                    </h4>
                  </div>
                  {branch.address && (
                    <p className='text-muted-foreground text-sm mb-1'>
                      {branch.address}
                    </p>
                  )}
                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                    {branch.phone && <span>📞 {branch.phone}</span>}
                    {branch.manager && <span>👤 {branch.manager}</span>}
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  className='p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer'
                  onClick={() => handleEdit(branch)}>
                  <Edit className='w-4 h-4' />
                </Button>
                <Button
                  className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer'
                  onClick={() => deleteBranch.mutate(branch.id)}
                  disabled={deleteBranch.isPending}>
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filteredBranches.length === 0 && (
          <p className='text-muted-foreground text-center py-4'>
            Nenhuma filial encontrada.
          </p>
        )}
      </div>
    </div>
  )
}
