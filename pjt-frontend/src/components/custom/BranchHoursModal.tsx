import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Save, X } from 'lucide-react'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BranchHour {
  id: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  isOpen: boolean
  lunchStartTime: string | null
  lunchEndTime: string | null
}

interface BranchHoursModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export function BranchHoursModal({
  open,
  onOpenChange,
}: BranchHoursModalProps) {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()

  const { data: branchHours = [], isLoading } = useQuery({
    queryKey: ['branch-hours', activeBranch?.id],
    queryFn: async () => {
      if (!activeBranch?.id) return []
      const response = await axios.get(`/api/branch-hours/${activeBranch.id}`)
      return response.data as BranchHour[]
    },
    enabled: !!activeBranch?.id && open,
  })

  const [hours, setHours] = useState<BranchHour[]>([])

  React.useEffect(() => {
    if (branchHours.length > 0) {
      setHours(branchHours)
    }
  }, [branchHours])

  const updateMutation = useMutation({
    mutationFn: async (data: BranchHour[]) => {
      if (!activeBranch?.id) throw new Error('Filial não selecionada')

      await axios.put(`/api/branch-hours/${activeBranch.id}/bulk`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-hours'] })
      queryClient.invalidateQueries({ queryKey: ['branch-time-slots'] })
      toast.success('Horários atualizados com sucesso!')
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar horários')
    },
  })

  const handleChange = (
    dayOfWeek: number,
    field: keyof BranchHour,
    value: any
  ) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      )
    )
  }

  const handleSave = () => {
    updateMutation.mutate(hours)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Clock className='w-5 h-5 text-purple-600' />
            Horários de Funcionamento
          </DialogTitle>
          <DialogDescription>
            Configure os horários de abertura e fechamento para cada dia da
            semana
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Clock className='w-8 h-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='space-y-3'>
            {daysOfWeek.map((day) => {
              const dayHours = hours.find((h) => h.dayOfWeek === day.value)
              if (!dayHours) return null

              return (
                <div
                  key={day.value}
                  className='bg-muted/30 rounded-lg p-3 border border-border'>
                  <div className='flex flex-col gap-3'>
                    {/* Header - Dia + Toggle */}
                    <div className='flex items-center justify-between'>
                      <Label className='text-sm font-semibold'>
                        {day.label}
                      </Label>
                      <div className='flex items-center gap-2'>
                        <Switch
                          checked={dayHours.isOpen}
                          onCheckedChange={(checked) =>
                            handleChange(day.value, 'isOpen', checked)
                          }
                        />
                        <span className='text-xs text-muted-foreground min-w-[50px]'>
                          {dayHours.isOpen ? 'Aberto' : 'Fechado'}
                        </span>
                      </div>
                    </div>

                    {dayHours.isOpen && (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        {/* Horário de Funcionamento */}
                        <div className='space-y-2'>
                          <Label className='text-xs text-muted-foreground'>
                            Horário de Funcionamento
                          </Label>
                          <div className='grid grid-cols-2 gap-2'>
                            <div>
                              <Label className='text-xs'>Abertura</Label>
                              <Input
                                type='time'
                                value={dayHours.startTime}
                                onChange={(e) =>
                                  handleChange(
                                    day.value,
                                    'startTime',
                                    e.target.value
                                  )
                                }
                                className='h-9 text-sm'
                              />
                            </div>
                            <div>
                              <Label className='text-xs'>Fechamento</Label>
                              <Input
                                type='time'
                                value={dayHours.endTime}
                                onChange={(e) =>
                                  handleChange(
                                    day.value,
                                    'endTime',
                                    e.target.value
                                  )
                                }
                                className='h-9 text-sm'
                              />
                            </div>
                          </div>
                        </div>

                        {/* Horário de Almoço */}
                        <div className='space-y-2'>
                          <Label className='text-xs text-muted-foreground'>
                            Horário de Almoço (Opcional)
                          </Label>
                          <div className='grid grid-cols-2 gap-2'>
                            <div>
                              <Label className='text-xs'>Início</Label>
                              <Input
                                type='time'
                                value={dayHours.lunchStartTime || ''}
                                onChange={(e) =>
                                  handleChange(
                                    day.value,
                                    'lunchStartTime',
                                    e.target.value || null
                                  )
                                }
                                className='h-9 text-sm'
                                placeholder='--:--'
                              />
                            </div>
                            <div>
                              <Label className='text-xs'>Fim</Label>
                              <Input
                                type='time'
                                value={dayHours.lunchEndTime || ''}
                                onChange={(e) =>
                                  handleChange(
                                    day.value,
                                    'lunchEndTime',
                                    e.target.value || null
                                  )
                                }
                                className='h-9 text-sm'
                                placeholder='--:--'
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs'>
          <p className='font-medium text-blue-900 mb-1'>ℹ️ Informações:</p>
          <ul className='list-disc list-inside space-y-0.5 text-blue-800'>
            <li>Horários de agendamento gerados de 10 em 10 minutos</li>
            <li>Horário de almoço bloqueia novos agendamentos</li>
            <li>Dias fechados não permitem agendamentos</li>
            <li>Alterações afetam imediatamente o calendário</li>
          </ul>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}>
            <X className='w-4 h-4 mr-2' />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className='bg-purple-600 hover:bg-purple-700'>
            <Save className='w-4 h-4 mr-2' />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
