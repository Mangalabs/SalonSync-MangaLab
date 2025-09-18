import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

import { ProfessionalForm } from './ProfessionalForm'
import { ProfessionalCommissionCard } from './ProfessionalCommissionCard'

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
}

export function ProfessionalTable() {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const [expandedProfessional, setExpandedProfessional] = useState<string | null>(null)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data.filter((p: Professional) => p.branchId === activeBranch?.id)
    },
    enabled: !!activeBranch,
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
      toast.error(error.response?.data?.message || 'Erro ao excluir profissional')
      setDeletingProfessional(null)
    },
  })

  const toggleExpanded = (id: string) => setExpandedProfessional(expandedProfessional === id ? null : id)

  if (isLoading) {return <p>Carregando...</p>}

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">{activeBranch?.name}</h3>
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
            onClick={() => setCreatingNew(true)}
          >
            <PlusCircle className="w-4 h-4" />
            Novo Profissional
          </Button>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-4 gap-4 font-semibold text-gray-700">
            <div>Nome</div>
            <div>Função</div>
            <div>Comissão</div>
            <div>Ações</div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {professionals.map((prof) => (
            <div key={prof.id}>
              <div
                className={`px-6 py-4 hover:bg-purple-50 transition-colors cursor-pointer grid grid-cols-4 gap-4 items-center ${selectedProfessional === prof.id ? 'bg-[#D4AF37]/10' : ''}`}
                onClick={() => {
                  toggleExpanded(prof.id)
                  setSelectedProfessional(prof.id)
                  queryClient.invalidateQueries({ queryKey: ['monthly-commission', prof.id] })
                  queryClient.invalidateQueries({ queryKey: ['daily-commission', prof.id] })
                  queryClient.invalidateQueries({ queryKey: ['professional', prof.id] })
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                    {prof.name[0]}
                  </div>
                  <div className="font-medium text-gray-800">{prof.name}</div>
                  <div className="ml-auto">
                    {expandedProfessional === prof.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
                <div className="text-gray-700">{prof.customRole?.title || prof.role}</div>
                <div className="font-semibold text-purple-600">{prof.customRole?.commissionRate || prof.commissionRate}%</div>
                <div className="flex space-x-2">
                  <Button
                    className='p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors'
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProfessional(prof)
                    }}
                  >
                    <Edit className='w-4 h-4' />
                  </Button>
                  <Button
                    className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingProfessional(prof)
                    }}
                  >
                    <Trash2 className='w-4 h-4' />
                    
                  </Button>
                </div>
              </div>

              {expandedProfessional === prof.id && <ProfessionalCommissionCard professionalId={prof.id} />}
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={!!editingProfessional || creatingNew}
        onOpenChange={() => {
          setEditingProfessional(null)
          setCreatingNew(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creatingNew ? 'Novo Profissional' : 'Editar Profissional'}</DialogTitle>
          </DialogHeader>
          <ProfessionalForm
            initialData={editingProfessional}
            onSuccess={() => {
              setEditingProfessional(null)
              setCreatingNew(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProfessional} onOpenChange={() => setDeletingProfessional(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingProfessional?.name}"?
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
              className="bg-[#DC2626] hover:bg-[#DC2626]/90"
              onClick={() => deletingProfessional && deleteProfessional.mutate(deletingProfessional.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
