import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useFormQueries } from '@/hooks/useFormQueries'
import { Label } from '@/components/ui/label'
import { useAppointmentForm } from '@/hooks/useAppointmentForm'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import axios from '@/lib/axios'

import { ProfessionalSelector } from '../professional/ProfessionalSelector'
import { ClientSelector } from '../client/ClientSelector'
import { ServiceSelector } from '../service/ServiceSelector'
import { SchedulingFields } from '../scheduling/SchedulingFields'

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
  
  const { professionals } = useFormQueries()
  const { form, mutation } = useAppointmentForm(mode, professionals, onSuccess, initialData)
  
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form
  
  React.useEffect(() => {
    if (!isAdmin && activeBranch?.id && !watch('branchId')) {
      setValue('branchId', activeBranch.id)
    }
  }, [isAdmin, activeBranch?.id, setValue, watch])
  const selectedBranchId = watch('branchId')
  const selectedProfessional = watch('professionalId')
  const selectedDate = isScheduled ? watch('scheduledDate' as any) : undefined
  
  const branchData = useFormQueries(selectedProfessional, selectedDate, isScheduled, selectedBranchId)
  const { availableSlots, refetchAvailableSlots } = branchData
  
  // Refetch horários quando profissional ou data mudar
  React.useEffect(() => {
    if (selectedProfessional && selectedDate && isScheduled) {
      refetchAvailableSlots?.()
    }
  }, [selectedProfessional, selectedDate, isScheduled, refetchAvailableSlots])

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
