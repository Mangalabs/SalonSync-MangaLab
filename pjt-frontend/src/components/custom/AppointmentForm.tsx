import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'


import { ProfessionalSelector } from './ProfessionalSelector'
import { ClientSelector } from './ClientSelector'
import { ServiceSelector } from './ServiceSelector'
import { SchedulingFields } from './SchedulingFields'

import { useFormQueries } from '@/hooks/useFormQueries'
import { Label } from '@/components/ui/label'
import { useAppointmentForm } from '@/hooks/useAppointmentForm'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import axios from '@/lib/axios'



export function AppointmentForm({ 
  onSuccess, 
  mode = 'immediate',
  initialData,
}: { 
  onSuccess: () => void;
  mode?: 'immediate' | 'scheduled';
  initialData?: any;
}) {
  const isScheduled = mode === 'scheduled'
  const { isAdmin } = useUser()
  const { activeBranch } = useBranch()
  
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
    enabled: isAdmin,
  })
  
  // Primeiro buscar os dados básicos
  const { professionals, clients, services } = useFormQueries()
  const { form, mutation } = useAppointmentForm(mode, professionals, onSuccess, initialData)
  
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form
  
  // Definir branchId padrão para não-admins usando useEffect
  React.useEffect(() => {
    if (!isAdmin && activeBranch?.id && !watch('branchId')) {
      setValue('branchId', activeBranch.id)
    }
  }, [isAdmin, activeBranch?.id, setValue, watch])
  const selectedBranchId = watch('branchId')
  const selectedProfessional = watch('professionalId')
  const selectedDate = isScheduled ? watch('scheduledDate' as any) : undefined
  
  // Buscar dados da filial selecionada
  const branchData = useFormQueries(selectedProfessional, selectedDate, isScheduled, selectedBranchId)
  const { availableSlots } = branchData



  const watchedServices = watch('serviceIds')
  const total = useMemo(() => (
    branchData.services
      .filter((s) => watchedServices?.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0) || 0
  ), [watchedServices, branchData.services])

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-3">
      {isAdmin && (
        <div>
          <Label className="text-sm">Filial</Label>
          <Combobox
            options={branches.map((branch: any) => ({
              value: branch.id,
              label: branch.name,
            }))}
            value={selectedBranchId}
            onValueChange={(value) => {
              setValue('branchId', value)
              setValue('professionalId', '')
              setValue('clientId', '')
              setValue('serviceIds', [])
            }}
            placeholder="Selecione uma filial"
            searchPlaceholder="Pesquisar filial..."
          />
          {errors.branchId && (
            <p className="text-xs text-red-500">{errors.branchId.message}</p>
          )}
        </div>
      )}
      
      <ProfessionalSelector 
        control={control} 
        professionals={branchData.professionals} 
        errors={errors} 
        branchId={selectedBranchId}
      />
      
      <ClientSelector 
        control={control} 
        clients={branchData.clients} 
        errors={errors} 
        branchId={selectedBranchId}
      />
      
      <ServiceSelector 
        control={control} 
        services={branchData.services} 
        errors={errors} 
      />

      {isScheduled && (
        <SchedulingFields
          control={control}
          errors={errors}
          availableSlots={availableSlots}
          selectedProfessional={selectedProfessional || ''}
          selectedDate={selectedDate || ''}
        />
      )}

      <div className="font-semibold text-sm sm:text-base text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded">
        Total: R$ {total.toFixed(2)}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full text-sm h-8">
        {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar' : (isScheduled ? 'Agendar' : 'Finalizar')}
      </Button>
    </form>
  )
}
