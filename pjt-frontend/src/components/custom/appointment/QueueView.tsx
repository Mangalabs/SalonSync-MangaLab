import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { useQueueCalculations } from '@/hooks/useQueueCalculations'
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates'
import { ProfessionalColumn } from './ProfessionalColumn'

export function QueueView() {
  const { activeBranch } = useBranch()
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const { data: queueStats = [], isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['queue-stats', activeBranch?.id, selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const dateParam = selectedDate.toISOString().split('T')[0]
      const res = await axios.get(`/api/appointments/queue-stats?date=${dateParam}`)
      return res.data
    },
    enabled: !!activeBranch,
  })

  const { data: professionals = [], isLoading: professionalsLoading } = useQuery({
    queryKey: ['professionals', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data
    },
    enabled: !!activeBranch,
  })

  // Hooks para cálculos e atualizações em tempo real
  const queueCalculations = useQueueCalculations(queueStats, selectedDate)
  const realTimeUpdates = useRealTimeUpdates({
    refetchFunction: refetchQueue,
    intervalMs: 30000,
    isActive: true
  })

  // Os profissionais já vem filtrados do backend
  const branchProfessionals = queueStats

  const formatDate = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return 'Hoje'
    }
    
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const isLoading = queueLoading || professionalsLoading

  return (
    <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h3 className='text-lg font-semibold text-foreground capitalize'>
            Fila de Atendimento - {formatDate(selectedDate)}
          </h3>
          <div className='flex items-center gap-4 mt-1'>
            <p className='text-sm text-muted-foreground'>
              {activeBranch ? `${activeBranch.name}` : ''}
            </p>
            <div className='flex items-center gap-2 text-xs'>
              {realTimeUpdates.getConnectionStatus() === 'connected' && (
                <><Wifi className='w-3 h-3 text-green-500' />
                <span className='text-green-600'>Conectado</span></>
              )}
              {realTimeUpdates.getConnectionStatus() === 'updating' && (
                <><RefreshCw className='w-3 h-3 text-blue-500 animate-spin' />
                <span className='text-blue-600'>Atualizando...</span></>
              )}
              {realTimeUpdates.getConnectionStatus() === 'warning' && (
                <><AlertCircle className='w-3 h-3 text-yellow-500' />
                <span className='text-yellow-600'>Reconectando...</span></>
              )}
              {realTimeUpdates.getConnectionStatus() === 'stale' && (
                <><WifiOff className='w-3 h-3 text-red-500' />
                <span className='text-red-600'>Desconectado</span></>
              )}
              <span className='text-muted-foreground'>•</span>
              <span className='text-muted-foreground'>{realTimeUpdates.getTimeSinceLastUpdate()}</span>
            </div>
          </div>
        </div>
        
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => changeDate(-1)}
            className='px-3 py-2 bg-button-bg text-button-text rounded-xl font-medium hover:bg-button-hover transition-colors flex items-center gap-2'>
            <ChevronLeft className='w-4 h-4' />
          </button>
          
          <button
            onClick={() => setSelectedDate(new Date())}
            className='px-4 py-2 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 transition-colors'>
            Hoje
          </button>
          
          <button
            onClick={() => changeDate(1)}
            className='px-3 py-2 bg-button-bg text-button-text rounded-xl font-medium hover:bg-button-hover transition-colors flex items-center gap-2'>
            <ChevronRight className='w-4 h-4' />
          </button>
          
          <button
            onClick={realTimeUpdates.forceUpdate}
            disabled={realTimeUpdates.isUpdating}
            className='px-3 py-2 bg-button-bg text-button-text rounded-xl font-medium hover:bg-button-hover transition-colors flex items-center gap-2 disabled:opacity-50'>
            <RefreshCw className={`w-4 h-4 ${realTimeUpdates.isUpdating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='bg-muted rounded-xl p-4 animate-pulse'>
              <div className='h-6 bg-muted-foreground/20 rounded mb-4'></div>
              <div className='space-y-3'>
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className='h-16 bg-muted-foreground/10 rounded'></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {branchProfessionals.map((professionalStats: any) => (
            <ProfessionalColumn
              key={professionalStats.professionalId}
              professionalStats={professionalStats}
              selectedDate={selectedDate}
              queueCalculations={queueCalculations}
            />
          ))}
        </div>
      )}

      {!isLoading && branchProfessionals.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>
            Nenhum profissional ativo encontrado para esta filial.
          </p>
        </div>
      )}
    </div>
  )
}