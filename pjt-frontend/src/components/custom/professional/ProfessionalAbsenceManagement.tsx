import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Calendar, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react'

import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const absenceTypeColors: Record<string, string> = {
  VACATION: 'bg-[var(--color-primary-10)] text-[var(--color-primary)]',
  SICK_LEAVE:
    'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
  PERSONAL: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  TRAINING: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  OTHER: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
}

export function ProfessionalAbsenceManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null)
  const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null)
  const queryClient = useQueryClient()

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data
    },
  })

  const { data: absences = [], isLoading } = useQuery<Absence[]>({
    queryKey: ['professional-absences'],
    queryFn: async () => {
      const res = await axios.get('/api/professional-absences')
      return res.data
    },
    retry: false,
    refetchOnWindowFocus: false,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceSchema),
  })

  const createAbsence = useMutation({
    mutationFn: async (data: AbsenceFormData) => {
      if (editingAbsence) {
        await axios.patch(
          `/api/professional-absences/${editingAbsence.id}`,
          data,
        )
      } else {
        await axios.post('/api/professional-absences', data)
      }
    },
    onSuccess: () => {
      toast.success(
        editingAbsence ? 'Ausência atualizada!' : 'Ausência registrada!',
      )
      reset()
      setShowForm(false)
      setEditingAbsence(null)
      queryClient.invalidateQueries({ queryKey: ['professional-absences'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao salvar ausência'
      if (!message.includes('não encontrado')) {
        toast.error(message)
      }
    },
  })

  const deleteAbsence = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/professional-absences/${id}`)
    },
    onSuccess: () => {
      toast.success('Ausência removida!')
      queryClient.invalidateQueries({ queryKey: ['professional-absences'] })
      setDeletingAbsence(null)
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Erro ao remover ausência'
      if (!message.includes('não encontrado')) {
        toast.error(message)
      }
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR')

  const isDateRangeValid = () => {
    const startDate = watch('startDate')
    const endDate = watch('endDate')
    if (!startDate || !endDate) {
      return true
    }
    return new Date(startDate) <= new Date(endDate)
  }

  if (isLoading) {
    return (
      <div className='text-[var(--color-foreground)]'>
        Carregando ausências...
      </div>
    )
  }

  return (
    <div className='bg-[var(--color-card)] rounded-2xl p-6 shadow-sm border border-[var(--color-border)] text-[var(--color-foreground)]'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-lg font-semibold flex items-center gap-2 text-[var(--color-foreground)]'>
          <Calendar className='w-5 h-5 text-[var(--color-foreground)]' />
          Ausências dos Profissionais
        </h3>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              onClick={handleNew}
              className=' bg-primary
                text-secondary
                py-3 px-4 rounded-xl font-medium 
                hover:opacity-80 transition-opacity cursor-pointer'>
              <Plus className='w-4 h-4' />
              Nova Ausência
            </Button>
          </DialogTrigger>
          <DialogContent className='bg-[var(--color-card)] text-[var(--color-foreground)]'>
            <DialogHeader>
              <DialogTitle>
                {editingAbsence ? 'Editar Ausência' : 'Registrar Nova Ausência'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div>
                <Label htmlFor='professionalId'>Profissional</Label>
                <Select
                  value={watch('professionalId')}
                  onValueChange={(value) => setValue('professionalId', value)}>
                  <SelectTrigger className='border border-[var(--color-border)] bg-[var(--color-input-background)]'>
                    <SelectValue placeholder='Selecione um profissional' />
                  </SelectTrigger>
                  <SelectContent className='bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)]'>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.professionalId && (
                  <p className='text-sm text-[var(--color-destructive)]'>
                    {errors.professionalId.message}
                  </p>
                )}
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='startDate'>Data de Início</Label>
                  <Input
                    id='startDate'
                    type='date'
                    {...register('startDate')}
                    className='border border-[var(--color-border)] bg-[var(--color-input-background)]'
                  />
                  {errors.startDate && (
                    <p className='text-sm text-[var(--color-destructive)]'>
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='endDate'>Data de Fim</Label>
                  <Input
                    id='endDate'
                    type='date'
                    {...register('endDate')}
                    className='border border-[var(--color-border)] bg-[var(--color-input-background)]'
                  />
                  {errors.endDate && (
                    <p className='text-sm text-[var(--color-destructive)]'>
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              {!isDateRangeValid() && (
                <div className='flex items-center gap-2 text-[var(--color-destructive)] text-sm'>
                  <AlertTriangle className='w-4 h-4' />A data de fim deve ser
                  posterior à data de início
                </div>
              )}

              <div>
                <Label htmlFor='type'>Tipo de Ausência</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(value) => setValue('type', value as any)}>
                  <SelectTrigger className='border border-[var(--color-border)] bg-[var(--color-input-background)]'>
                    <SelectValue placeholder='Selecione o tipo' />
                  </SelectTrigger>
                  <SelectContent className='bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)]'>
                    {Object.entries(absenceTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className='text-sm text-[var(--color-destructive)]'>
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='reason'>Motivo (Opcional)</Label>
                <Textarea
                  id='reason'
                  {...register('reason')}
                  placeholder='Descreva o motivo da ausência...'
                  className='border border-[var(--color-border)] bg-[var(--color-input-background)]'
                />
              </div>

              <div className='flex justify-end gap-3 mt-6'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowForm(false)}
                  className='border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'>
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={createAbsence.isPending || !isDateRangeValid()}
                  className='bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-20)]'>
                  {createAbsence.isPending
                    ? 'Salvando...'
                    : editingAbsence
                      ? 'Atualizar'
                      : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='space-y-4'>
        {absences.map((absence) => (
          <div
            key={absence.id}
            className='border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-card)]'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <h4 className='font-semibold text-[var(--color-foreground)]'>
                    {absence.professional.name}
                  </h4>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      absenceTypeColors[absence.type]
                    }`}>
                    {absenceTypeLabels[absence.type]}
                  </span>
                </div>
                <div className='text-sm text-[var(--color-muted-foreground)] mb-1'>
                  <strong>Período:</strong> {formatDate(absence.startDate)} até{' '}
                  {formatDate(absence.endDate)}
                </div>
                {absence.reason && (
                  <div className='text-sm text-[var(--color-muted-foreground)]'>
                    <strong>Motivo:</strong> {absence.reason}
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleEdit(absence)}
                  className='text-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] border border-[var(--color-border)]'>
                  <Edit className='w-4 h-4' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setDeletingAbsence(absence)}
                  className='text-[var(--color-destructive)] hover:text-[var(--color-destructive-foreground)] border border-[var(--color-border)]'>
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {absences.length === 0 && (
          <div className='text-center py-12'>
            <Calendar className='w-16 h-16 text-[var(--color-muted-foreground)] mx-auto mb-4' />
            <h3 className='text-lg font-medium text-[var(--color-foreground)] mb-2'>
              Nenhuma ausência registrada
            </h3>
            <p className='text-[var(--color-muted-foreground)]'>
              Registre ausências para evitar agendamentos em dias indisponíveis.
            </p>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deletingAbsence}
        onOpenChange={() => setDeletingAbsence(null)}>
        <AlertDialogContent className='bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)]'>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ausência de{' '}
              <strong>{deletingAbsence?.professional.name}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingAbsence && deleteAbsence.mutate(deletingAbsence.id)
              }
              className='bg-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/80 text-[var(--color-destructive-foreground)]'>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
