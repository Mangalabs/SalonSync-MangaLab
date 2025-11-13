import { useMemo } from 'react'

export function useQueueCalculations(queueStats: any[], selectedDate: Date) {
  return useMemo(() => {
    const now = new Date()
    const isToday = selectedDate.toDateString() === now.toDateString()

    const formatTimeRemaining = (appointment: any, status: string) => {
      if (!isToday) {
        return null
      }

      const scheduledAt = new Date(appointment.scheduledAt)
      const diffMs = scheduledAt.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      if (status === 'in-progress') {
        const estimatedEndTime = new Date(
          now.getTime() + appointment.duration * 60000
        )
        const remainingMs = estimatedEndTime.getTime() - now.getTime()
        const remainingMinutes = Math.floor(remainingMs / (1000 * 60))

        return `${remainingMinutes}min restantes`
      }

      if (diffMinutes < -5) {
        return `${Math.abs(diffMinutes)}min atrasado`
      }

      if (diffMinutes <= 5) {
        return diffMinutes <= 0 ? 'agora' : `em ${diffMinutes}min`
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
