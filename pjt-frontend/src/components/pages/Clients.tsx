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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Clientes</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
              onClick={() => {
                setEditingClient(null)
                setOpen(true)
              }}
            >
              + Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
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

      <ClientTable
        onEdit={(client) => {
          setEditingClient(client)
          setOpen(true)
        }}
      />
    </div>
  )
}
