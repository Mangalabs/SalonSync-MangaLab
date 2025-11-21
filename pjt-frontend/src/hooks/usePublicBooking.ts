import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'

const publicApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/public`,
})



export function useBranchBySlug(businessSlug: string, branchSlug: string) {
  return useQuery({
    queryKey: ['branch', businessSlug, branchSlug],
    queryFn: async () => {
      try {
        const { data } = await publicApi.get(`/branch/${businessSlug}/${branchSlug}`)
        return data
      } catch (error: any) {
        if (error.response?.status === 500) {
          console.log('Tentando rota alternativa...')
          const { data } = await publicApi.get(`/branch/${branchSlug}`)
          return data
        }
        throw error
      }
    },
    enabled: !!businessSlug && !!branchSlug,
    retry: (failureCount, error: any) => {
      if (error.response?.status === 500) return failureCount < 1
      return failureCount < 3
    }
  })
}

export function useBranchServices(branchId: string) {
  return useQuery({
    queryKey: ['branch-services', branchId],
    queryFn: async () => {
      if (!branchId) {
        throw new Error('branchId é obrigatório')
      }
      
      const { data } = await publicApi.get(`/branch/${branchId}/services`)
      return data
    },
    enabled: !!branchId
  })
}

export function useBranchProfessionals(branchId: string) {
  return useQuery({
    queryKey: ['branch-professionals', branchId],
    queryFn: async () => {
      const { data } = await publicApi.get(`/branch/${branchId}/professionals`)
      return data
    },
    enabled: !!branchId,
  })
}

export function useProfessionalAvailability(
  professionalId: string,
  date: string,
) {
  return useQuery({
    queryKey: ['professional-availability', professionalId, date],
    queryFn: async () => {
      if (!professionalId || !date) {
        throw new Error('professionalId e date são obrigatórios')
      }
      
      const { data } = await publicApi.get(
        `/professional/${professionalId}/availability/${date}`,
      )
      return data
    },
    enabled: !!professionalId && !!date,
    staleTime: 30000
  })
}

export function useCreatePublicAppointment() {
  return useMutation({
    mutationFn: async (data: {
      clientName: string
      clientPhone: string
      clientEmail?: string
      serviceId: string
      serviceIds?: string[]
      professionalId: string
      scheduledAt: string
      branchId: string
    }) => {
      const { data: appointment } = await publicApi.post('/appointments', data)
      return appointment
    },
  })
}
