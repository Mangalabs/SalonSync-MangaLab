import { Controller } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ClientForm } from './ClientForm'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'


interface ClientSelectorProps {
  control: any;
  clients: { id: string; name: string; phone?: string }[];
  errors: any;
  branchId?: string;
}

export function ClientSelector({ control, clients, errors, branchId }: ClientSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  return (
    <>
      <div className="flex justify-between items-center">
        <Label className="text-sm">Cliente</Label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <ClientForm 
              onSuccess={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Controller
        name="clientId"
        control={control}
        render={({ field }) => (
          <Combobox
            options={clients.map((c) => ({
              value: c.id,
              label: c.phone ? `${c.name} - ${c.phone}` : c.name,
            }))}
            value={field.value}
            onValueChange={field.onChange}
            placeholder="Selecione um cliente"
            searchPlaceholder="Pesquisar cliente..."
            disabled={!branchId && clients.length === 0}
          />
        )}
      />
      {errors.clientId && (
        <p className="text-xs text-red-500">{errors.clientId.message}</p>
      )}
    </>
  )
}