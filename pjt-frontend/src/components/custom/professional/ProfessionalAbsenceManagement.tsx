import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Calendar, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react'


import { LoadingState, EmptyState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'

import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
} from '@/components/ui/alert-dialog'

const absenceSchema = z.object({
  professionalId: z.string().min(1, 'Selecione um profissional'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória'),
  reason: z.string().optional(),
  type: z.enum(['VACATION', 'SICK_LEAVE', 'PERSONAL', 'TRAINING', 'OTHER']),
})

type AbsenceFormData = z.infer<typeof absenceSchema>

interface Absence {
  id: string
  professionalId: string
  startDate: string
  endDate: string
  reason?: string
  type: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'TRAINING' | 'OTHER'
  professional: { name: string }
}

interface Professional {
  id: string
  name: string
}

const absenceTypeLabels = {
  VACATION: 'Férias',
  SICK_LEAVE: 'Atestado Médico',
  PERSONAL: 'Pessoal',
  TRAINING: 'Treinamento',
  OTHER: 'Outro',
}

const absenceTypeColors = {
  VACATION: 'bg-blue-100 text-blue-700',
  SICK_LEAVE: 'bg-red-100 text-red-700',
  PERSONAL: 'bg-yellow-100 text-yellow-700',
  TRAINING: 'bg-green-100 text-green-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

export function ProfessionalAbsenceManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null)
  const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null)
  const queryClient = useQueryClient()

  const { data: professionals = [], error: professionalsError, isLoading: professionalsLoading } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data
    },
  })

  const { data: absences = [], isLoading } = useQuery<Absence[]>({
    queryKey: ['professional-absences'],
    queryFn: async () => {
      // Como o endpoint não existe ainda, retornar array vazio
      return []
    },
    enabled: false, // Desabilitar a query até o endpoint ser implementado
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceSchema),
  })

  const createAbsence = useMutation({
    mutationFn: async (data: AbsenceFormData) => {
      // Simular sucesso até o endpoint ser implementado
      console.log('Dados da ausência:', data)
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Funcionalidade em desenvolvimento')
      reset()
      setShowForm(false)
      setEditingAbsence(null)
    },
    onError: () => {
      toast.error('Funcionalidade em desenvolvimento')
    },
  })

  const deleteAbsence = useMutation({
    mutationFn: async (id: string) => {
      // Simular sucesso até o endpoint ser implementado
      console.log('Removendo ausência:', id)
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Funcionalidade em desenvolvimento')
      setDeletingAbsence(null)
    },
    onError: () => {
      toast.error('Funcionalidade em desenvolvimento')
    },
  })

  const onSubmit = (data: AbsenceFormData) => {
    createAbsence.mutate(data)
  }

  const handleEdit = (absence: Absence) => {
    setEditingAbsence(absence)
    reset({
      professionalId: absence.professionalId,
      startDate: absence.startDate.split('T')[0],
      endDate: absence.endDate.split('T')[0],
      reason: absence.reason || '',
      type: absence.type,
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingAbsence(null)
    reset()
    setShowForm(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isDateRangeValid = () => {
    const startDate = watch('startDate')
    const endDate = watch('endDate')
    if (!startDate || !endDate) return true
    return new Date(startDate) <= new Date(endDate)
  }

  if (professionalsError) {
    return (
      <LoadingState 
        error={professionalsError} 
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['professionals'] })}
      />
    )
  }

  if (professionalsLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div className="flex gap-2">
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Ausências dos Profissionais
        </h3>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              onClick={handleNew}
              className="bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Ausência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAbsence ? 'Editar Ausência' : 'Registrar Nova Ausência'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="professionalId">Profissional</Label>
                <Select
                  value={watch('professionalId')}
                  onValueChange={(value) => setValue('professionalId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.professionalId && (
                  <p className="text-sm text-red-500">{errors.professionalId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate')}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endDate">Data de Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register('endDate')}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {!isDateRangeValid() && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  A data de fim deve ser posterior à data de início
                </div>
              )}

              <div>
                <Label htmlFor="type">Tipo de Ausência</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(value) => setValue('type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(absenceTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reason">Motivo (Opcional)</Label>
                <Textarea
                  id="reason"
                  {...register('reason')}
                  placeholder="Descreva o motivo da ausência..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createAbsence.isPending || !isDateRangeValid()}
                >
                  {createAbsence.isPending ? 'Salvando...' : editingAbsence ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : absences.length === 0 ? (
          <EmptyState 
            icon={Calendar}
            title="Nenhuma ausência registrada"
            description="Registre ausências para evitar agendamentos em dias indisponíveis."
            action={
              <Button onClick={handleNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Ausência
              </Button>
            }
          />
        ) : (
          absences.map((absence) => (
            <div key={absence.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-800">{absence.professional.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${absenceTypeColors[absence.type]}`}>
                      {absenceTypeLabels[absence.type]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>Período:</strong> {formatDate(absence.startDate)} até {formatDate(absence.endDate)}
                  </div>
                  {absence.reason && (
                    <div className="text-sm text-gray-600">
                      <strong>Motivo:</strong> {absence.reason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(absence)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeletingAbsence(absence)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingAbsence} onOpenChange={() => setDeletingAbsence(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ausência de <strong>{deletingAbsence?.professional.name}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAbsence && deleteAbsence.mutate(deletingAbsence.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}