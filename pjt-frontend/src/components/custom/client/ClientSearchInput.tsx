import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ClientForm } from './ClientForm'

interface Client {
  id: string
  name: string
}

interface ClientSearchInputProps {
  id: string
  value: string
  onChange: (clientId: string) => void
  clients: Client[]
  error?: string
}

export function ClientSearchInput({
  id,
  value,
  onChange,
  clients,
  error,
}: ClientSearchInputProps) {
  const [clientSearch, setClientSearch] = useState('')
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)

  const selectedClient = clients.find((c) => c.id === value)
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  return (
    <div>
      <label
        htmlFor={id}
        className='block text-sm font-medium text-foreground mb-2'>
        Cliente
      </label>
      <div className='relative'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5' />
          <input
            id={id}
            type='text'
            placeholder='Buscar cliente...'
            value={selectedClient ? selectedClient.name : clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value)
              setClientDropdownOpen(true)
              if (!e.target.value) onChange('')
            }}
            onFocus={() => setClientDropdownOpen(true)}
            className='w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
          />
        </div>
        {clientDropdownOpen && (
          <div className='absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto'>
            {filteredClients.length === 0 ? (
              <div className='p-3 text-sm text-muted-foreground text-center'>
                Nenhum cliente encontrado
              </div>
            ) : (
              filteredClients.map((c) => (
                <button
                  key={c.id}
                  type='button'
                  onClick={() => {
                    onChange(c.id)
                    setClientSearch('')
                    setClientDropdownOpen(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onChange(c.id)
                      setClientSearch('')
                      setClientDropdownOpen(false)
                    }
                  }}
                  className='w-full text-left p-3 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-b-0'>
                  {c.name}
                </button>
              ))
            )}
          </div>
        )}
        {clientDropdownOpen && (
          <div
            className='fixed inset-0 z-40'
            onClick={() => setClientDropdownOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setClientDropdownOpen(false)
              }
            }}
            role='button'
            tabIndex={0}
            aria-label='Fechar busca de clientes'
          />
        )}
      </div>
      {error && <p className='text-xs text-destructive mt-1'>{error}</p>}

      <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
        <DialogTrigger asChild>
          <button
            type='button'
            className='mt-2 text-sm text-primary hover:opacity-80 font-medium flex items-center gap-1'>
            <UserPlus className='w-4 h-4' />
            Novo Cliente
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => setClientModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
