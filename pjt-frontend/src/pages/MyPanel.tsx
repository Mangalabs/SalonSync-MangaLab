import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DollarSign,
  Calendar,
  Clock,
  Plus,
  Trash2,
  TrendingUp,
  Filter,
} from 'lucide-react'

import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTime } from '@/utils/dateTime'

interface ScheduleBlock {
  id: string
  date: string
  startTime: string
  endTime: string
  reason?: string
}

type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'

export default function MyPanel() {
  const { user } = useUser()
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() =>
    DateTime.now().format('YYYY-MM-DD')
  )
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [newBlock, setNewBlock] = useState({
    startTime: '14:00',
    endTime: '16:00',
    reason: '',
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data.filter((p: any) => p.branchId === activeBranch?.id)
    },
    enabled: !!activeBranch,
  })

  const professionalInfo = professionals?.find(
    (p: any) => p.name?.toLowerCase() === user?.name?.toLowerCase()
  )

  const getCommissionDateRange = () => {
    const today = DateTime.now()

    if (selectedPeriod === 'custom') {
      if (customStartDate && customEndDate) {
        return { startDate: customStartDate, endDate: customEndDate }
      }
      const startOfMonth = DateTime.startOf(today, 'month')
      return {
        startDate: startOfMonth.format('YYYY-MM-DD'),
        endDate: today.format('YYYY-MM-DD'),
      }
    }

    switch (selectedPeriod) {
      case 'week': {
        const weekAgo = DateTime.subtract(today, 7, 'day')
        return {
          startDate: weekAgo.format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD'),
        }
      }
      case 'month': {
        const startOfMonth = DateTime.startOf(today, 'month')
        return {
          startDate: startOfMonth.format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD'),
        }
      }
      case 'quarter': {
        const threeMonthsAgo = DateTime.subtract(today, 90, 'day')
        return {
          startDate: threeMonthsAgo.format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD'),
        }
      }
      case 'year': {
        const startOfYear = DateTime.startOf(today, 'year')
        return {
          startDate: startOfYear.format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD'),
        }
      }
      case 'all': {
        return {
          startDate: '2020-01-01',
          endDate: today.format('YYYY-MM-DD'),
        }
      }
      default:
        return {
          startDate: DateTime.startOf(today, 'month').format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD'),
        }
    }
  }

  const { startDate: commissionStartDate, endDate: commissionEndDate } =
    getCommissionDateRange()

  const { data: commissionData, isLoading: loadingCommission } = useQuery({
    queryKey: [
      'professional-commission',
      professionalInfo?.id,
      commissionStartDate,
      commissionEndDate,
    ],
    queryFn: async () => {
      const res = await axios.get(
        `/api/professionals/${professionalInfo.id}/commission`,
        {
          params: {
            startDate: commissionStartDate,
            endDate: commissionEndDate,
          },
        }
      )
      return res.data
    },
    enabled: !!professionalInfo?.id,
  })

  const today = DateTime.now()
  const blocksEndDate = DateTime.add(today, 7, 'day').format('YYYY-MM-DD')

  const { data: scheduleBlocks = [], isLoading: loadingBlocks } = useQuery({
    queryKey: [
      'schedule-blocks',
      professionalInfo?.id,
      selectedDate,
      blocksEndDate,
    ],
    queryFn: async () => {
      const res = await axios.get(
        `/api/schedule-blocks/professional/${professionalInfo.id}`,
        {
          params: { startDate: selectedDate, endDate: blocksEndDate },
        }
      )
      return res.data
    },
    enabled: !!professionalInfo?.id,
  })

  const createBlockMutation = useMutation({
    mutationFn: async (data: {
      professionalId: string
      date: string
      startTime: string
      endTime: string
      reason?: string
    }) => {
      const res = await axios.post('/api/schedule-blocks', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-blocks', professionalInfo?.id],
      })
      setBlockDialogOpen(false)
      setNewBlock({ startTime: '14:00', endTime: '16:00', reason: '' })
    },
  })

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      await axios.delete(`/api/schedule-blocks/${blockId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-blocks', professionalInfo?.id],
      })
    },
  })

  const handleCreateBlock = () => {
    if (!professionalInfo?.id) return

    if (newBlock.startTime >= newBlock.endTime) {
      alert('Horário de início deve ser antes do horário final')
      return
    }

    createBlockMutation.mutate({
      professionalId: professionalInfo.id,
      date: selectedDate,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      reason: newBlock.reason || undefined,
    })
  }

  const handleDeleteBlock = (blockId: string) => {
    if (confirm('Remover este bloqueio?')) {
      deleteBlockMutation.mutate(blockId)
    }
  }

  const quickBlocks = [
    { label: 'Almoço (12:00-13:00)', start: '12:00', end: '13:00' },
    { label: 'Almoço (13:00-14:00)', start: '13:00', end: '14:00' },
    { label: 'Tarde (14:00-18:00)', start: '14:00', end: '18:00' },
    { label: 'Manhã (09:00-12:00)', start: '09:00', end: '12:00' },
  ]

  const applyQuickBlock = (start: string, end: string) => {
    setNewBlock({ ...newBlock, startTime: start, endTime: end })
  }

  const blocksByDate = scheduleBlocks.reduce(
    (acc: Record<string, ScheduleBlock[]>, block: ScheduleBlock) => {
      const date = DateTime.fromISO(block.date).format('YYYY-MM-DD')
      if (!acc[date]) acc[date] = []
      acc[date].push(block)
      return acc
    },
    {}
  )

  const totalCommission = commissionData?.summary?.totalCommission || 0

  const totalServiceCommission =
    commissionData?.summary?.appointmentCommissions || 0

  const totalProductCommission =
    commissionData?.summary?.productCommissions || 0

  const totalAppointments = commissionData?.summary?.totalAppointments || 0

  if (!professionalInfo) {
    return (
      <div className='p-4 md:p-6'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-center text-muted-foreground'>
              Carregando informações...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background pb-20 md:pb-6'>
      {/* Header Mobile-First */}
      <div className='bg-primary text-primary-foreground p-4 md:p-6'>
        <h1 className='text-2xl font-bold mb-1'>Olá, {user?.name}! 👋</h1>
        <p className='text-sm opacity-90'>
          {DateTime.now().format('DD [de] MMMM [de] YYYY')}
        </p>
      </div>

      <div className='p-4 md:p-6 space-y-4'>
        {/* Comissões do Mês */}
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <DollarSign className='h-5 w-5' />
                Minhas Comissões
              </CardTitle>
              <Dialog
                open={periodDialogOpen}
                onOpenChange={setPeriodDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant='outline' size='sm' className='gap-1'>
                    <Filter className='h-4 w-4' />
                    <span className='hidden sm:inline'>Período</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-[95vw] sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Filtrar Período</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label>Período</Label>
                      <Select
                        value={selectedPeriod}
                        onValueChange={(value) =>
                          setSelectedPeriod(value as PeriodType)
                        }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='week'>Últimos 7 dias</SelectItem>
                          <SelectItem value='month'>Este mês</SelectItem>
                          <SelectItem value='quarter'>
                            Últimos 3 meses
                          </SelectItem>
                          <SelectItem value='year'>Este ano</SelectItem>
                          <SelectItem value='all'>Todo período</SelectItem>
                          <SelectItem value='custom'>
                            Período customizado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPeriod === 'custom' && (
                      <div className='space-y-3'>
                        <div className='space-y-2'>
                          <Label htmlFor='custom-start'>Data Início</Label>
                          <Input
                            id='custom-start'
                            type='date'
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='custom-end'>Data Fim</Label>
                          <Input
                            id='custom-end'
                            type='date'
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => setPeriodDialogOpen(false)}
                      className='w-full'>
                      Aplicar Filtro
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCommission ? (
              <p className='text-muted-foreground'>Carregando...</p>
            ) : (
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-3xl font-bold text-primary'>
                    {totalCommission.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                <div className='grid grid-cols-2 gap-4 pt-2 border-t'>
                  <div>
                    <p className='text-xs text-muted-foreground'>Serviços</p>
                    <p className='text-lg font-semibold'>
                      {totalServiceCommission.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Produtos</p>
                    <p className='text-lg font-semibold'>
                      {totalProductCommission.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloqueios de Agenda */}
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Bloqueios de Agenda
              </CardTitle>
              <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogTrigger asChild>
                  <Button size='sm' className='gap-1'>
                    <Plus className='h-4 w-4' />
                    <span className='hidden sm:inline'>Novo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-[95vw] sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Bloquear Horário</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='block-date'>Data</Label>
                      <Input
                        id='block-date'
                        type='date'
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className='w-full'
                      />
                    </div>

                    {/* Quick Actions */}
                    <div className='space-y-2'>
                      <Label>Atalhos Rápidos</Label>
                      <div className='grid grid-cols-1 gap-2'>
                        {quickBlocks.map((qb) => (
                          <Button
                            key={qb.label}
                            variant='outline'
                            size='sm'
                            onClick={() => applyQuickBlock(qb.start, qb.end)}
                            className='justify-start text-left h-auto py-2'>
                            {qb.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='start-time'>Início</Label>
                        <Input
                          id='start-time'
                          type='time'
                          value={newBlock.startTime}
                          onChange={(e) =>
                            setNewBlock({
                              ...newBlock,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='end-time'>Fim</Label>
                        <Input
                          id='end-time'
                          type='time'
                          value={newBlock.endTime}
                          onChange={(e) =>
                            setNewBlock({
                              ...newBlock,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='reason'>Motivo (opcional)</Label>
                      <Textarea
                        id='reason'
                        placeholder='Ex: Almoço, compromisso pessoal...'
                        value={newBlock.reason}
                        onChange={(e) =>
                          setNewBlock({ ...newBlock, reason: e.target.value })
                        }
                        rows={2}
                      />
                    </div>

                    <Button
                      onClick={handleCreateBlock}
                      disabled={createBlockMutation.isPending}
                      className='w-full'>
                      {createBlockMutation.isPending
                        ? 'Salvando...'
                        : 'Bloquear Horário'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingBlocks ? (
              <p className='text-muted-foreground text-sm'>Carregando...</p>
            ) : scheduleBlocks.length === 0 ? (
              <p className='text-muted-foreground text-sm'>
                Nenhum bloqueio nos próximos 7 dias
              </p>
            ) : (
              <div className='space-y-4'>
                {Object.entries(blocksByDate)
                  .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                  .map(([date, blocks]) => {
                    const isToday = date === DateTime.now().format('YYYY-MM-DD')
                    const dateLabel = isToday
                      ? 'Hoje'
                      : DateTime.fromDate(date).format('DD/MM (ddd)')

                    return (
                      <div key={date} className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm font-medium'>
                            {dateLabel}
                          </span>
                        </div>
                        <div className='space-y-2 pl-6'>
                          {(blocks as ScheduleBlock[]).map((block) => (
                            <div
                              key={block.id}
                              className='flex items-start justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2'>
                                  <Clock className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
                                  <span className='font-medium text-sm'>
                                    {block.startTime} - {block.endTime}
                                  </span>
                                </div>
                                {block.reason && (
                                  <p className='text-xs text-muted-foreground mt-1 pl-5'>
                                    {block.reason}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleDeleteBlock(block.id)}
                                disabled={deleteBlockMutation.isPending}
                                className='h-8 w-8 p-0 flex-shrink-0'>
                                <Trash2 className='h-4 w-4 text-destructive' />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Rápidos */}
        {commissionData && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-muted-foreground'>Atendimentos</p>
                  <p className='text-2xl font-bold'>{totalAppointments}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Ticket Médio</p>
                  <p className='text-2xl font-bold'>
                    {totalAppointments > 0
                      ? (totalCommission / totalAppointments).toLocaleString(
                          'pt-BR',
                          {
                            style: 'currency',
                            currency: 'BRL',
                          }
                        )
                      : 'R$ 0,00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
