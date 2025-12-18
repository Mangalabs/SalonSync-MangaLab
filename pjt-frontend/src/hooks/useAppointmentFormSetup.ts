import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import { useFormQueries } from '@/hooks/useFormQueries'
import { useAppointmentForm } from '@/hooks/useAppointmentForm'
import axios from '@/lib/axios'

interface UseAppointmentFormSetupOptions {
  type: 'immediate' | 'scheduled'
  onSuccess?: () => void
  initialData?: any
  includeAvailableSlots?: boolean
}

export function useAppointmentFormSetup({
  type,
  onSuccess,
  initialData,
  includeAvailableSlots = false,
}: UseAppointmentFormSetupOptions) {
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

  const { professionals } = useFormQueries(
    undefined,
    undefined,
    false,
    activeBranch?.id
  )

  const { form, mutation } = useAppointmentForm(
    type,
    professionals,
    () => {
      onSuccess?.()
    },
    initialData
  )

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = form

  useEffect(() => {
    if (!isAdmin && activeBranch?.id) {
      setValue('branchId', activeBranch.id)
    }
  }, [isAdmin, activeBranch?.id, setValue])

  const selectedBranchId = watch('branchId')
  const selectedProfessional = includeAvailableSlots
    ? watch('professionalId')
    : undefined
  const selectedDate = includeAvailableSlots
    ? watch('scheduledDate')
    : undefined

  const branchData = useFormQueries(
    selectedProfessional,
    selectedDate,
    includeAvailableSlots,
    selectedBranchId
  )

  const {
    services = [],
    clients = [],
    professionals: profs = [],
    availableSlots = [],
  } = branchData

  const watchedServices = watch('serviceIds') || []
  const selectedServices = (Array.isArray(services) ? services : []).filter(
    (s: any) => watchedServices.includes(s.id)
  )
  const totalPrice = selectedServices.reduce(
    (acc: number, s: any) => acc + (s.price || 0),
    0
  )

  const onSubmit = (data: any) => {
    mutation.mutate(data)
  }

  return {
    form,
    handleSubmit,
    watch,
    setValue,
    isSubmitting,
    errors,
    onSubmit,

    isAdmin,
    branches,
    selectedBranchId,

    services,
    clients,
    professionals: profs,
    availableSlots,

    selectedProfessional,
    selectedDate,

    watchedServices,
    selectedServices,
    totalPrice,
  }
}
