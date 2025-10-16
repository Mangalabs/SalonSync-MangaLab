import React from 'react'

interface ProfessionalStatusProps {
  status: string
  stats: {
    averageDelay: number
    completedToday: number
    efficiency: number
  }
  isToday: boolean
}

export function ProfessionalStatus({ status, stats, isToday }: ProfessionalStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'overdue':
        return {
          label: 'Atrasado',
          color: 'bg-red-500',
          textColor: 'text-red-700'
        }
      case 'busy':
        return {
          label: 'Ocupado',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700'
        }
      case 'next':
        return {
          label: 'Próximo',
          color: 'bg-blue-500',
          textColor: 'text-blue-700'
        }
      case 'scheduled':
        return {
          label: 'Agendado',
          color: 'bg-blue-500',
          textColor: 'text-blue-700'
        }
      case 'free':
      default:
        return {
          label: 'Livre',
          color: 'bg-green-500',
          textColor: 'text-green-700'
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className='flex flex-col items-end gap-1'>
      <div className='flex items-center gap-2'>
        <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`}></div>
        <span className={`text-xs font-medium ${statusDisplay.textColor}`}>
          {statusDisplay.label}
        </span>
      </div>
      {isToday && stats.averageDelay !== 0 && (
        <div className='text-xs text-muted-foreground'>
          {stats.averageDelay > 0 ? '+' : ''}{stats.averageDelay}min médio
        </div>
      )}
    </div>
  )
}