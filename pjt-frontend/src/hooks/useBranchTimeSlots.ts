import { useQuery } from '@tanstack/react-query'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

export function useBranchTimeSlots(date?: Date) {
  const { activeBranch } = useBranch()

  const dayOfWeek = date ? date.getDay() : new Date().getDay()

  return useQuery({
    queryKey: ['branch-time-slots', activeBranch?.id, dayOfWeek],
    queryFn: async () => {
      if (!activeBranch?.id) return []

      const response = await axios.get(
        `/api/branch-hours/${activeBranch.id}/time-slots/${dayOfWeek}`
      )

      return response.data as string[]
    },
    enabled: !!activeBranch?.id,
    staleTime: 0, // Sempre revalidar para pegar horários atualizados
    gcTime: 0, // Não cachear em memória
  })
}
