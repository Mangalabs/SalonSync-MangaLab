import { Clock, User, DollarSign } from 'lucide-react'

interface CommandCardProps {
  appointment: {
    id: string
    client: {
      name: string
    }
    professional: {
      name: string
    }
    total: string | number
    status: string
    scheduledAt: string
  }
  onClick: () => void
}

export function CommandCard({ appointment, onClick }: CommandCardProps) {
  const total = Number(appointment.total || 0)
  const time = new Date(appointment.scheduledAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      onClick={onClick}
      className='border border-primary/50 bg-accent/10 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary'>
      {/* Header - Status Badge */}
      <div className='flex items-center justify-between mb-3'>
        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30'>
          EM ANDAMENTO
        </span>
        <div className='flex items-center text-xs text-muted-foreground'>
          <Clock className='w-3 h-3 mr-1' />
          {time}
        </div>
      </div>

      {/* Cliente e Profissional */}
      <div className='space-y-2 mb-3'>
        <div className='flex items-center text-sm'>
          <User className='w-4 h-4 mr-2 text-muted-foreground' />
          <span className='font-medium text-foreground'>
            {appointment.client.name}
          </span>
        </div>
        <div className='flex items-center text-sm text-muted-foreground'>
          <div className='w-4 h-4 mr-2' /> {/* Espaço para alinhar */}
          <span>com {appointment.professional.name}</span>
        </div>
      </div>

      {/* Total */}
      <div className='flex items-center justify-between pt-3 border-t border-border'>
        <span className='text-sm font-medium text-muted-foreground'>
          Total atual
        </span>
        <div className='flex items-center font-semibold text-primary'>
          <DollarSign className='w-4 h-4' />
          <span className='text-lg'>{total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* Indicador de ação */}
      <div className='mt-3 text-xs text-center text-primary font-medium'>
        Clique para gerenciar →
      </div>
    </div>
  )
}
