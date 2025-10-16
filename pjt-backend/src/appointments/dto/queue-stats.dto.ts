export interface QueueStatsDto {
  professionalId: string
  professionalName: string
  currentAppointment?: {
    id: string
    client: string
    service: string
    scheduledAt: string
    duration: number
    estimatedEndTime: string
  }
  upcomingAppointments: {
    id: string
    client: string
    service: string
    scheduledAt: string
    duration: number
  }[]
  stats: {
    averageDelay: number
    completedToday: number
    efficiency: number
    totalWaitTime: number
  }
  status: 'free' | 'busy' | 'next' | 'overdue' | 'scheduled'
  nextAvailableTime?: string
}