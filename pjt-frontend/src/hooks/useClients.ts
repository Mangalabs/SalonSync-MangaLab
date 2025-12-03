import { useQuery } from '@tanstack/react-query'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

interface Client {
  id: string
  customerId: string
  name: string
  phone?: string
  email?: string
  branchId?: string
  lastVisit?: string
  subscription: { planName: string }
}

interface PaginatedClientsResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const useClients = (page: number = 1, limit: number = 12, search?: string) => {
  const { activeBranch } = useBranch()
  
  return useQuery<PaginatedClientsResponse>({
    queryKey: ['clients', activeBranch?.id, page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeBranch?.id) params.append('branchId', activeBranch.id)
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      
      const res = await axios.get(`/api/clients?${params}`)
      return res.data
    },
    enabled: !!activeBranch,
  })
}