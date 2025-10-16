import React from 'react'
import { Clock, User, Scissors } from 'lucide-react'

interface AppointmentQueueCardProps {
  appointment: {
    id: string
    scheduledAt: Date
    client: string
    service: string
    duration: number
    status: string
  }
  status: 'in-progress' | 'next' | 'waiting' | 'overdue'
  queueCalculations: any
}

export function AppointmentQueueCard({ appointment, status, queueCalculations }: AppointmentQueueCardProps) {
  const { formatTimeRemaining, isToday } = queueCalculations
  const now = new Date()
  const scheduledAt = new Date(appointment.scheduledAt)
  const isOverdue = isToday && scheduledAt < now && appointment.status === 'SCHEDULED'
  const actualStatus = isOverdue ? 'overdue' : status

  const getStatusStyles = () => {
    switch (actualStatus) {
      case 'in-progress':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          indicator: 'bg-yellow-500',
          text: 'text-yellow-800'
        }
      case 'next':
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          indicator: 'bg-blue-500',
          text: 'text-blue-800'
        }
      case 'overdue':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          indicator: 'bg-red-500',
          text: 'text-red-800'
        }
      default:
        return {
          border: 'border-border',
          bg: 'bg-card',
          indicator: 'bg-muted-foreground',
          text: 'text-foreground'
        }
    }
  }

  const styles = getStatusStyles()
  const timeRemaining = formatTimeRemaining({ ...appointment, scheduledAt }, actualStatus)

  return (
    <div className={`p-3 rounded-lg border ${styles.border} ${styles.bg} transition-all`}>
      <div className='flex items-start justify-between'>
        <div className='flex items-start gap-2 flex-1'>
          <div className={`w-2 h-2 rounded-full ${styles.indicator} mt-2 flex-shrink-0`}></div>
          
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-1 mb-1'>
              <Clock className='w-3 h-3 text-muted-foreground flex-shrink-0' />
              <span className='text-sm font-medium text-foreground'>
                {appointment.scheduledAt.split('T')[1]?.slice(0, 5) || '00:00'}
              </span>
            </div>
            
            <div className='flex items-center gap-1 mb-1'>
              <User className='w-3 h-3 text-muted-foreground flex-shrink-0' />
              <span className='text-sm text-foreground truncate'>{appointment.client}</span>
            </div>
            
            <div className='flex items-center gap-1'>
              <Scissors className='w-3 h-3 text-muted-foreground flex-shrink-0' />
              <span className='text-xs text-muted-foreground truncate'>{appointment.service}</span>
              <span className='text-xs text-muted-foreground'>({appointment.duration}min)</span>
            </div>
          </div>
        </div>
      </div>
      
      {timeRemaining && (
        <div className='mt-2 pt-2 border-t border-current/10'>
          <span className={`text-xs font-medium ${styles.text}`}>
            {timeRemaining}
          </span>
        </div>
      )}
    </div>
  )
}