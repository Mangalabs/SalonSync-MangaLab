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
    <div className="container mx-auto px-3 sm:px-6 py-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
          Clientes
        </h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
              onClick={() => {
                setEditingClient(null)
                setOpen(true)
              }}
            >
              + Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] sm:max-w-lg">
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

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
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
