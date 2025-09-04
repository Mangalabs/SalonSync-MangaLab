import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import axios from '@/lib/axios'

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface BranchContextType {
  activeBranch: Branch | null;
  branches: Branch[];
  setActiveBranch: (branch: Branch) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function BranchProvider({ children }: { children: ReactNode }) {
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null)
  const queryClient = useQueryClient()

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
  })

  useEffect(() => {

    if (branches.length > 0 && !activeBranch) {
      const savedBranchId = localStorage.getItem('activeBranchId')
      const savedBranch = branches.find((b: Branch) => b.id === savedBranchId)
      const selectedBranch = savedBranch || branches[0]

      setActiveBranchState(selectedBranch)

      if (!savedBranchId) {
        localStorage.setItem('activeBranchId', selectedBranch.id)
      }
    }
  }, [branches, activeBranch])

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch)
    localStorage.setItem('activeBranchId', branch.id)

    queryClient.invalidateQueries({ queryKey: ['professionals'] })
    queryClient.invalidateQueries({ queryKey: ['services'] })
    queryClient.invalidateQueries({ queryKey: ['clients'] })
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] })
    queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
    queryClient.invalidateQueries({ queryKey: ['roles'] })

  }

  return (
    <BranchContext.Provider
      value={{
        activeBranch,
        branches,
        setActiveBranch,
        isLoading,
      }}
    >
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider')
  }
  return context
}
