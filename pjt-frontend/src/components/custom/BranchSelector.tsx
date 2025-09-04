import { useState } from 'react'
import { ChevronDown, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'

export function BranchSelector() {
  const { activeBranch, branches, setActiveBranch } = useBranch()
  const { isAdmin } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  // Só mostrar para admins com múltiplas filiais
  if (!isAdmin || branches.length <= 1) {
    return null
  }

  const handleBranchChange = async (branchId: string) => {
    setIsLoading(true)
    try {
      const branch = branches.find((b) => b.id === branchId)
      if (branch) {
        setActiveBranch(branch)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
          disabled={isLoading}
        >
          <Building2 size={16} />
          <span className="hidden sm:inline">
            {activeBranch?.name || 'Selecionar Filial'}
          </span>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleBranchChange(branch.id)}
            className={`flex items-center gap-2 ${
              activeBranch?.id === branch.id ? 'bg-primary/10' : ''
            }`}
          >
            <Building2 size={16} />
            <div className="flex-1">
              <div className="font-medium">{branch.name}</div>
              {branch.address && (
                <div className="text-xs text-muted-foreground">
                  {branch.address}
                </div>
              )}
            </div>
            {activeBranch?.id === branch.id && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}