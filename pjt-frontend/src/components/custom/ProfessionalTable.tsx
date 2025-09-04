import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Edit, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { ProfessionalForm } from './ProfessionalForm'
import { ProfessionalCommissionCard } from './ProfessionalCommissionCard'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'


type Professional = {
  id: string;
  name: string;
  role: string;
  roleId?: string;
  commissionRate?: number;
  branchId: string;
  branch?: {
    name: string;
  };
  customRole?: {
    id: string;
    title: string;
    commissionRate: number;
  };
};

export function ProfessionalTable() {
  const queryClient = useQueryClient()
  const [editingProfessional, setEditingProfessional] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null)
  const { activeBranch } = useBranch()

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data.filter((prof: Professional) => prof.branchId === activeBranch?.id)
    },
    enabled: !!activeBranch,
  })

  // Reset selected professional when branch changes
  useEffect(() => {
    setSelectedProfessional(null)
  }, [activeBranch?.id])

  // Force refetch commission data when professional is selected
  useEffect(() => {
    if (selectedProfessional) {
      queryClient.invalidateQueries({ queryKey: ['monthly-commission', selectedProfessional] })
      queryClient.invalidateQueries({ queryKey: ['daily-commission', selectedProfessional] })
      queryClient.invalidateQueries({ queryKey: ['professional', selectedProfessional] })
    }
  }, [selectedProfessional, queryClient])

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
      toast.error(error.response?.data?.message || 'Erro ao excluir profissional')
      setDeletingProfessional(null)
    },
  })

  if (isLoading) {return <p>Carregando...</p>}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="border rounded-md bg-white">
          <div className="border-b p-4">
            <h3 className="text-lg font-semibold text-[#1A1A1A]">{activeBranch?.name}</h3>
            <p className="text-sm text-[#737373]">{professionals.length} profissional(is)</p>
          </div>
          
          {professionals.length === 0 ? (
            <div className="p-4 text-center text-[#737373]">
              Nenhum profissional cadastrado nesta filial
            </div>
          ) : (
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Nome</th>
                    <th className="py-2">Função</th>
                    <th className="py-2">Comissão</th>
                    <th className="py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {professionals.map((prof: Professional) => (
                    <tr 
                      key={prof.id} 
                      className={`border-t cursor-pointer hover:bg-gray-50 ${selectedProfessional === prof.id ? 'bg-[#D4AF37]/10' : ''}`}
                      onClick={() => setSelectedProfessional(prof.id)}
                    >
                      <td className="py-2 font-medium">{prof.name}</td>
                      <td className="py-2">
                        {prof.customRole ? (
                          <span className="text-[#D4AF37] font-medium">
                            {prof.customRole.title}
                          </span>
                        ) : (
                          prof.role || 'N/A'
                        )}
                      </td>
                      <td className="py-2">
                        {prof.customRole ? prof.customRole.commissionRate : (prof.commissionRate || 0)}%
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProfessional(prof)
                            }}
                            className="border-[#D4AF37]/20 hover:bg-[#D4AF37]/10"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingProfessional(prof)
                            }}
                            disabled={deleteProfessional.isPending}
                            className="bg-[#DC2626] hover:bg-[#DC2626]/90"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div>
        {selectedProfessional ? (
          <ProfessionalCommissionCard professionalId={selectedProfessional} />
        ) : (
          <div className="border rounded-md p-6 text-center text-gray-500">
            <DollarSign className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p>Selecione um profissional para ver as comissões</p>
          </div>
        )}
      </div>

      <Dialog
        open={!!editingProfessional}
        onOpenChange={() => setEditingProfessional(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Profissional</DialogTitle>
          </DialogHeader>
          <ProfessionalForm
            initialData={editingProfessional}
            onSuccess={() => setEditingProfessional(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingProfessional}
        onOpenChange={() => setDeletingProfessional(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o profissional "{deletingProfessional?.name}"?
              <br /><br />
              Esta ação não pode ser desfeita e irá:
              <br />• Remover o profissional do sistema
              <br />• Desativar despesas fixas relacionadas
              <br />• Remover acesso ao sistema (se houver)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProfessional && deleteProfessional.mutate(deletingProfessional.id)}
              className="bg-[#DC2626] hover:bg-[#DC2626]/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
