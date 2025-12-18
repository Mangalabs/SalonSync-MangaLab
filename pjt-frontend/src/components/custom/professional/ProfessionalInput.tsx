import { useUser } from '@/contexts/UserContext'

interface ProfessionalInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  professionals: Array<{ id: string; name: string }>
  className?: string
}

export function ProfessionalInput({
  id,
  value,
  onChange,
  professionals,
  className = 'w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground',
}: ProfessionalInputProps) {
  const { user, isProfessional, isAdmin, canManageOthers } = useUser()

  if (isProfessional && !isAdmin && !canManageOthers) {
    return (
      <input
        id={id}
        type='text'
        value={user?.name || ''}
        disabled
        className='w-full p-3 border border-border rounded-xl bg-muted text-foreground cursor-not-allowed'
      />
    )
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}>
      <option value=''>Selecione o profissional</option>
      {professionals.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  )
}
