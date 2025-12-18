interface Branch {
  id: string
  name: string
}

interface BranchSelectProps {
  id: string
  value: string
  onChange: (branchId: string) => void
  branches: Branch[]
  error?: string
  onBranchChange?: () => void
}

export function BranchSelect({
  id,
  value,
  onChange,
  branches,
  error,
  onBranchChange,
}: BranchSelectProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className='block text-sm font-medium text-foreground mb-2'>
        Filial
      </label>
      <select
        id={id}
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value)
          onBranchChange?.()
        }}
        className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
        <option value=''>Selecione uma filial</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      {error && <p className='text-xs text-destructive mt-1'>{error}</p>}
    </div>
  )
}
