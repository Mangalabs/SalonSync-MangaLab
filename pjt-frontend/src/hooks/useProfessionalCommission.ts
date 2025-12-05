import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

interface CommissionData {
  summary: {
    totalCommission: number
    totalRevenue: number
    totalAppointments: number
  }
  dailyCommissions?: Array<{
    date: string
    commission: number
  }>
}

export function useProfessionalCommission(
  professionalId: string | undefined,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  const { activeBranch } = useBranch()
  const queryClient = useQueryClient()

  const query = useQuery<CommissionData>({
    queryKey: [
      'professional-commission',
      professionalId,
      startDate,
      endDate,
      activeBranch?.id,
    ],
    queryFn: async () => {
      if (!professionalId) {
        throw new Error('Professional ID is required')
      }

      const res = await axios.get(
        `/api/professionals/${professionalId}/commission?startDate=${startDate}&endDate=${endDate}`
      )
      return res.data
    },
    enabled: enabled && !!professionalId && !!activeBranch,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  })

  const refetchCommission = () => {
    queryClient.invalidateQueries({
      queryKey: ['professional-commission', professionalId],
    })
  }

  useEffect(() => {
    const handleAppointmentChange = () => {
      if (professionalId) {
        refetchCommission()
      }
    }

    window.addEventListener('appointmentCreated', handleAppointmentChange)
    window.addEventListener('appointmentUpdated', handleAppointmentChange)

    return () => {
      window.removeEventListener('appointmentCreated', handleAppointmentChange)
      window.removeEventListener('appointmentUpdated', handleAppointmentChange)
    }
  }, [professionalId])

  return {
    ...query,
    refetchCommission,
  }
}
