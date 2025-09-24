import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Building, MapPin, Plus, Edit, Trash2, Search as SearchIcon } from 'lucide-react'

import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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
  manager?: string
}

export function BranchManagement() {
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [search, setSearch] = useState('')
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)
  const queryClient = useQueryClient()

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BranchFormData>({
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

  const canDeleteBranch = () => {
    return branches.length > 1
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Filiais
        </h3>

        <Dialog open={showAddBranch} onOpenChange={setShowAddBranch}>
          <DialogTrigger asChild>
            <button
              onClick={handleNew}
              className="bg-purple-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Filial
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBranch ? 'Editar Filial' : 'Adicionar Nova Filial'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Filial</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" {...register('address')} />
                {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...register('phone')} />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBranch(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : editingBranch ? 'Atualizar' : 'Salvar Filial'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Input
            placeholder="Buscar filiais..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className={`space-y-4 ${filteredBranches.length > 5 ? 'max-h-[400px] overflow-y-auto' : ''}`}>
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{branch.name}</h4>
                  </div>
                  {branch.address && <p className="text-gray-600 text-sm mb-1">{branch.address}</p>}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {branch.phone && <span>📞 {branch.phone}</span>}
                    {branch.manager && <span>👤 {branch.manager}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className='p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors'
                  onClick={() => handleEdit(branch)}
                >
                  <Edit className='w-4 h-4' />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className={`p-2 rounded-lg transition-colors ${
                        canDeleteBranch()
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (!canDeleteBranch()) {
                          toast.error('Não é possível excluir a única filial')
                        } else {
                          setBranchToDelete(branch)
                        }
                      }}
                      disabled={deleteBranch.isPending || !canDeleteBranch()}
                      title={!canDeleteBranch() ? 'Não é possível excluir a única filial' : 'Excluir filial'}
                    >
                      <Trash2 className='w-4 h-4' />     
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a filial <strong>{branch.name}</strong>?
                        <br /><br />
                        Esta ação não pode ser desfeita e todos os dados relacionados a esta filial serão perdidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteBranch.mutate(branch.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir Filial
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
        {filteredBranches.length === 0 && <p className="text-gray-500 text-center py-4">Nenhuma filial encontrada.</p>}
      </div>
    </div>
  )
}
