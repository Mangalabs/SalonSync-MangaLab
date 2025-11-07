import { useMemo } from 'react'

export function useQueueCalculations(queueStats: any[], selectedDate: Date) {
  return useMemo(() => {
    const now = new Date()
    const isToday = selectedDate.toDateString() === now.toDateString()

    const formatTimeRemaining = (appointment: any, status: string) => {
      if (!isToday) {
        return null
      }

      let scheduledAt: Date
      if (typeof appointment.scheduledAt === 'string') {
        scheduledAt = new Date(appointment.scheduledAt)
      } else {
        scheduledAt = new Date(appointment.scheduledAt)
      }

      const localScheduled = new Date()
      localScheduled.setHours(
        scheduledAt.getHours(),
        scheduledAt.getMinutes(),
        0,
        0
      )

      const diffMs = localScheduled.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      if (status === 'in-progress') {
        const endTime = new Date(
          localScheduled.getTime() + appointment.duration * 60000
        )
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
