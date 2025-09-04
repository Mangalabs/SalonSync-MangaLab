import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Building2, Plus, Edit, Trash2 } from 'lucide-react'

import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const branchSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  address: z.string().optional(),
  phone: z.string().optional(),
})

type BranchFormData = z.infer<typeof branchSchema>;

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export function BranchManagement() {
  const [open, setOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
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
      setOpen(false)
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

  const onSubmit = (data: BranchFormData) => {
    createBranch.mutate(data)
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    reset({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
    })
    setOpen(true)
  }

  const handleNew = () => {
    setEditingBranch(null)
    reset()
    setOpen(true)
  }

  if (isLoading) {return <div>Carregando filiais...</div>}

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gerenciar Filiais
          </span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew} className="">
                <Plus className="h-4 w-4 mr-2" />
                Nova Filial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBranch ? 'Editar Filial' : 'Nova Filial'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Filial</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" {...register('address')} />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" {...register('phone')} />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Salvando...' : editingBranch ? 'Atualizar' : 'Criar Filial'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {branches.map((branch) => (
            <div key={branch.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{branch.name}</h4>
                  {branch.address && (
                    <p className="text-sm text-gray-500">{branch.address}</p>
                  )}
                  {branch.phone && (
                    <p className="text-sm text-gray-500">{branch.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(branch)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteBranch.mutate(branch.id)}
                    disabled={deleteBranch.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}