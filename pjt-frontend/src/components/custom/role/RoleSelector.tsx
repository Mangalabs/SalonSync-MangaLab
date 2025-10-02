import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'

import { RoleForm } from '../forms/RoleForm'

interface RoleSelectorProps {
  roles: { id: string; title: string; commissionRate?: number }[]
  selectedRoleId?: string
  onRoleChange: (roleId: string) => void
  branchId?: string
}

export function RoleSelector({ roles, selectedRoleId, onRoleChange, branchId }: RoleSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const handleRoleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] })
    setIsDialogOpen(false)
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <Label className="text-sm">Função</Label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Nova
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Função</DialogTitle>
            </DialogHeader>
            <RoleForm 
              onSuccess={handleRoleCreated}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Combobox
        options={[
          { value: 'custom', label: 'Função personalizada' },
          ...roles.map((role) => ({
            value: role.id,
            label: `${role.title} (${role.commissionRate || 0}%)`,
          })),
        ]}
        value={selectedRoleId || 'custom'}
        onValueChange={onRoleChange}
        placeholder="Selecione uma função"
        searchPlaceholder="Pesquisar função..."
        disabled={!branchId && roles.length === 0}
      />
    </>
  )
}