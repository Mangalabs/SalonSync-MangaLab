import { useMemo } from 'react'

export function useQueueCalculations(queueStats: any[], selectedDate: Date) {
  return useMemo(() => {
    const now = new Date()
    const isToday = selectedDate.toDateString() === now.toDateString()

    // Formatar tempo restante/atraso
    const formatTimeRemaining = (appointment: any, status: string) => {
      if (!isToday) {return null}

      // Extrair horário e criar data local
      let timeStr = '00:00'
      if (typeof appointment.scheduledAt === 'string') {
        timeStr = appointment.scheduledAt.split('T')[1]?.slice(0, 5) || '00:00'
      } else if (appointment.scheduledAt instanceof Date) {
        timeStr = appointment.scheduledAt.toISOString().split('T')[1]?.slice(0, 5) || '00:00'
      }
      
      const [aptHours, aptMinutes] = timeStr.split(':').map(Number)
      const scheduledAt = new Date()
      scheduledAt.setHours(aptHours, aptMinutes, 0, 0)
      
      const diffMs = scheduledAt.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      if (status === 'in-progress') {
        const endTime = new Date(scheduledAt.getTime() + appointment.duration * 60000)
        const remainingMs = endTime.getTime() - now.getTime()
        const remainingMinutes = Math.floor(remainingMs / (1000 * 60))
        
        return remainingMinutes > 0 
          ? `${remainingMinutes}min restantes`
          : `${Math.abs(remainingMinutes)}min atrasado`
      }

      if (diffMinutes < 0) {
        return `${Math.abs(diffMinutes)}min atrasado`
      }

      if (diffMinutes < 60) {
        return `em ${diffMinutes}min`
      }

      const hours = Math.floor(diffMinutes / 60)
      const mins = diffMinutes % 60
      return `em ${hours}h${mins > 0 ? ` ${mins}min` : ''}`
    }

    return {
      queueStats,
      formatTimeRemaining,
      isToday,
    }
  }, [queueStats, selectedDate])
}