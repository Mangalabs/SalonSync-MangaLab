import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBranch } from '@/contexts/BranchContext'

interface BranchFilterProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function BranchFilter({ value, onValueChange }: BranchFilterProps) {
  const { branches } = useBranch()

  if (branches.length <= 1) {return null}

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Filial:</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as filiais</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}