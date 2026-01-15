import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Save, Calendar } from 'lucide-react'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface BranchHour {
  id: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  isOpen: boolean
  lunchStartTime: string | null
  lunchEndTime: string | null
}

const daysOfWeek = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

export default function BranchHoursSettings() {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()

  const { data: branchHours = [], isLoading } = useQuery({
    queryKey: ['branch-hours', activeBranch?.id],
    queryFn: async () => {
      if (!activeBranch?.id) return []
      const response = await axios.get(`/api/branch-hours/${activeBranch.id}`)
      return response.data as BranchHour[]
    },
    enabled: !!activeBranch?.id,
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

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <Clock className='w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin' />
          <p className='text-muted-foreground'>Carregando horários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground flex items-center gap-2'>
              <Calendar className='w-6 h-6 text-purple-600' />
              Horários de Funcionamento
            </h2>
            <p className='text-muted-foreground mt-1'>
              Configure os horários de abertura e fechamento para cada dia da
              semana
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className='bg-purple-600 hover:bg-purple-700'>
            <Save className='w-4 h-4 mr-2' />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        <div className='space-y-4'>
          {daysOfWeek.map((day) => {
            const dayHours = hours.find((h) => h.dayOfWeek === day.value)
            if (!dayHours) return null

            return (
              <div
                key={day.value}
                className='bg-muted/30 rounded-xl p-4 border border-border'>
                <div className='grid grid-cols-1 md:grid-cols-12 gap-4 items-start'>
                  {/* Dia da Semana + Switch */}
                  <div className='md:col-span-2 flex flex-col gap-2'>
                    <Label className='text-sm font-semibold'>{day.label}</Label>
                    <div className='flex items-center gap-2'>
                      <Switch
                        checked={dayHours.isOpen}
                        onCheckedChange={(checked) =>
                          handleChange(day.value, 'isOpen', checked)
                        }
                      />
                      <span className='text-sm text-muted-foreground'>
                        {dayHours.isOpen ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                  </div>

                  {dayHours.isOpen && (
                    <>
                      {/* Horário de Funcionamento */}
                      <div className='md:col-span-4 space-y-2'>
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
                              className='h-9'
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
                              className='h-9'
                            />
                          </div>
                        </div>
                      </div>

                      {/* Horário de Almoço */}
                      <div className='md:col-span-4 space-y-2'>
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
                              className='h-9'
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
                              className='h-9'
                              placeholder='--:--'
                            />
                          </div>
                        </div>
                      </div>

                      {/* Preview de Horários */}
                      <div className='md:col-span-2 flex items-end'>
                        <div className='text-xs text-muted-foreground bg-background rounded-lg p-2 w-full'>
                          <Clock className='w-3 h-3 inline mr-1' />
                          {dayHours.startTime} - {dayHours.endTime}
                          {dayHours.lunchStartTime && dayHours.lunchEndTime && (
                            <div className='mt-1 text-amber-600'>
                              Almoço: {dayHours.lunchStartTime} -{' '}
                              {dayHours.lunchEndTime}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {!dayHours.isOpen && (
                    <div className='md:col-span-10 flex items-center justify-center py-4'>
                      <span className='text-sm text-muted-foreground'>
                        Estabelecimento fechado neste dia
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex gap-3'>
            <div className='text-blue-600 text-xl flex-shrink-0'>ℹ️</div>
            <div className='text-sm text-blue-900'>
              <p className='font-medium mb-1'>Informações Importantes:</p>
              <ul className='list-disc list-inside space-y-1 text-blue-800'>
                <li>
                  Os horários de agendamento serão gerados de 10 em 10 minutos
                </li>
                <li>
                  O horário de almoço será bloqueado automaticamente para novos
                  agendamentos
                </li>
                <li>
                  Dias marcados como "Fechado" não permitirão agendamentos
                </li>
                <li>
                  As alterações afetarão imediatamente o calendário e
                  agendamentos futuros
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
