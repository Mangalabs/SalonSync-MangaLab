import { useQuery } from '@tanstack/react-query'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

export function useFormQueries(selectedProfessional?: string, selectedDate?: string, isScheduled?: boolean, branchId?: string) {
  const { activeBranch } = useBranch()
  const targetBranchId = branchId || activeBranch?.id

  const professionals = useQuery<{ id: string; name: string }[]>({
    queryKey: ['professionals', targetBranchId],
    queryFn: async () => {
      const params = targetBranchId ? `?branchId=${targetBranchId}` : ''
      const res = await axios.get(`/api/professionals${params}`)
      return res.data
    },
    enabled: !!targetBranchId,
  })

  const clients = useQuery<{ id: string; name: string }[]>({
    queryKey: ['clients', targetBranchId],
    queryFn: async () => {
      const params = targetBranchId ? `?branchId=${targetBranchId}` : ''
      const res = await axios.get(`/api/clients${params}`)
      return res.data
    },
    enabled: !!targetBranchId,
  })

  const services = useQuery<{ id: string; name: string; price: number }[]>({
    queryKey: ['services', targetBranchId],
    queryFn: async () => {
      const params = targetBranchId ? `?branchId=${targetBranchId}` : ''
      const res = await axios.get(`/api/services${params}`)
      return res.data as any[]
    },
    select: (raw) =>
      (raw as any[]).map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
      })),
    enabled: !!targetBranchId,
  })
  
  const availableSlots = useQuery({
    queryKey: ['available-slots', selectedProfessional, selectedDate],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate || selectedProfessional === 'undefined' || selectedDate === 'undefined') {
        return []
      }
      const res = await axios.get(`/api/appointments/available-slots/${selectedProfessional}/${selectedDate}`)
      return res.data
    },
    enabled: isScheduled && !!selectedProfessional && !!selectedDate && selectedProfessional !== 'undefined' && selectedDate !== 'undefined',
  })

  return {
    professionals: professionals.data || [],
    clients: clients.data || [],
    services: services.data || [],
    availableSlots: availableSlots.data || [],
    isLoading: professionals.isLoading || clients.isLoading || services.isLoading,
  }
}