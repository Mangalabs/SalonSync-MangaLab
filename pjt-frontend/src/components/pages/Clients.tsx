import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ClientForm } from '@/components/custom/client/ClientForm'
import { ClientTable } from '@/components/custom/client/ClientTable'

export default function Clients() {
  const [open, setOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any | null>(null)

  return (
    <div
      className='container mx-auto px-3 sm:px-6 py-4 space-y-6'
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3'>
        <h1
          className='text-xl sm:text-2xl font-bold'
          style={{ color: 'var(--color-text)' }}>
          Clientes
        </h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className='bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 px-4 rounded-xl font-medium hover:opacity-60 transition-opacity cursor-pointer'
              style={{
                backgroundColor: 'var(--color-button-bg)',
                color: 'var(--color-button-text)',
              }}
              onClick={() => {
                setEditingClient(null)
                setOpen(true)
              }}>
              + Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent
            className='w-[95%] sm:max-w-lg '>
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <ClientForm
              initialData={editingClient}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div
        className='overflow-x-auto rounded-2xl shadow-sm border'
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 2px 8px var(--color-shadow)',
        }}>
        <ClientTable
          onEdit={(client) => {
            setEditingClient(client)
            setOpen(true)
          }}
        />
      </div>
    </div>
  )
}
