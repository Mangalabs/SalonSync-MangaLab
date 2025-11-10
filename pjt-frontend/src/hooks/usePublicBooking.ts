import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'

const publicApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/public`,
})

export function useBranchBySlug(branchSlug: string) {
  return useQuery({
    queryKey: ['branch', branchSlug],
    queryFn: async () => {
      const { data } = await publicApi.get(`/branch/${branchSlug}`)
      return data
    },
    enabled: !!branchSlug,
  })
}

export function useBranchServices(branchId: string) {
  return useQuery({
    queryKey: ['branch-services', branchId],
    queryFn: async () => {
      const { data } = await publicApi.get(`/branch/${branchId}/services`)
      return data
    },
    enabled: !!branchId,
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
      const { data } = await publicApi.get(
        `/professional/${professionalId}/availability/${date}`,
      )
      return data
    },
    enabled: !!professionalId && !!date,
  })
}

export function useCreatePublicAppointment() {
  return useMutation({
    mutationFn: async (data: {
      clientName: string
      clientPhone: string
      clientEmail?: string
      serviceId: string
      professionalId: string
      scheduledAt: string
      branchId: string
    }) => {
      const { data: appointment } = await publicApi.post('/appointments', data)
      return appointment
    },
  })
}
