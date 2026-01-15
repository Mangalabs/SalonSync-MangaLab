import { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { DateTime } from '@/utils/dateTime'

const createSchema = (isAdmin: boolean, isScheduled: boolean) => {
  const baseSchema = {
    professionalId: z.string().min(1, 'Selecione um profissional'),
    clientId: z.string().min(1, 'Selecione um cliente'),
    serviceIds: isScheduled
      ? z.array(z.string()).min(1, 'Selecione ao menos um serviço')
      : z.array(z.string()).optional(),
    ...(isAdmin && { branchId: z.string().min(1, 'Selecione uma filial') }),
  }

  if (isScheduled) {
    return z.object({
      ...baseSchema,
      scheduledDate: z.string().min(1, 'Data é obrigatória'),
      scheduledTime: z.string().min(1, 'Horário é obrigatório'),
    })
  }

  return z.object(baseSchema)
}

export function useAppointmentForm(
  mode: 'immediate' | 'scheduled',
  professionals: { id: string; name: string }[],
  onSuccess: () => void,
  initialData?: any
) {
  const queryClient = useQueryClient()
  const { user, isProfessional, isAdmin, canManageOthers } = useUser()
  const isScheduled = mode === 'scheduled'

  const getDefaultValues = () => {
    if (initialData) {
      return {
        professionalId:
          initialData.professionalId || initialData.professional?.id || '',
        clientId: initialData.clientId || initialData.client?.id || '',
        serviceIds:
          initialData.appointmentServices?.map((as: any) => as.service.id) ||
          [],
        ...(isScheduled && {
          scheduledDate:
            typeof initialData.scheduledAt === 'string'
              ? initialData.scheduledAt.split('T')[0]
              : initialData.scheduledAt?.toString()?.split('T')[0] || '',
          scheduledTime:
            typeof initialData.scheduledAt === 'string'
              ? initialData.scheduledAt.split('T')[1]?.slice(0, 5) || ''
              : initialData.scheduledAt
                  ?.toString()
                  ?.split('T')[1]
                  ?.slice(0, 5) || '',
        }),
        ...(isAdmin && { branchId: initialData.branchId || '' }),
      }
    }

    return isScheduled
      ? {
          professionalId: '',
          clientId: '',
          serviceIds: [],
          scheduledDate: '',
          scheduledTime: '',
          ...(isAdmin && { branchId: '' }),
        }
      : {
          professionalId: '',
          clientId: '',
          serviceIds: [],
          ...(isAdmin && { branchId: '' }),
        }
  }

  const form = useForm({
    resolver: zodResolver(createSchema(isAdmin, isScheduled)),
    defaultValues: getDefaultValues(),
  })

  const currentProfessionalId = useMemo(() => {
    if (
      isProfessional &&
      !isAdmin &&
      !canManageOthers &&
      user?.name &&
      professionals.length > 0
    ) {
      const currentProfessional = professionals.find(
        (p) => p.name === user.name
      )
      return currentProfessional?.id || ''
    }
    return ''
  }, [isProfessional, isAdmin, canManageOthers, user?.name, professionals])

  useEffect(() => {
    if (currentProfessionalId) {
      form.setValue('professionalId', currentProfessionalId)
    }
  }, [currentProfessionalId, form])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      let scheduledAt: string
      let status: string

      if (isScheduled && 'scheduledDate' in data && 'scheduledTime' in data) {
        scheduledAt = `${data.scheduledDate} ${data.scheduledTime}:00`
        status = 'PENDING'
      } else {
        // Para comandas (IN_PROGRESS), usar hora local de São Paulo
        const now = DateTime.now()
        const currentMinutes = now.minute()
        const currentHour = now.hour()

        // Arredondar minutos para múltiplo de 10 mais próximo
        const roundedMinutes = Math.round(currentMinutes / 10) * 10

        // Ajustar hora se minutos arredondados >= 60
        let finalHour = currentHour
        let finalMinutes = roundedMinutes

        if (roundedMinutes >= 60) {
          finalHour = currentHour + 1
          finalMinutes = 0
        }

        // Formatar no formato local (sem timezone)
        scheduledAt = now
          .hour(finalHour)
          .minute(finalMinutes)
          .second(0)
          .format('YYYY-MM-DD HH:mm:ss')

        status = 'IN_PROGRESS'
      }
      let finalProfessionalId =
        isProfessional && !isAdmin && !canManageOthers
          ? currentProfessionalId
          : data.professionalId

      if (
        isProfessional &&
        !isAdmin &&
        !canManageOthers &&
        !finalProfessionalId &&
        user?.name
      ) {
        const professional = professionals.find((p) => p.name === user.name)
        finalProfessionalId = professional?.id || ''
      }

      const payload = {
        clientId: data.clientId,
        professionalId: finalProfessionalId,
        serviceIds: data.serviceIds || [],
        scheduledAt,
        status,
      }

      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {}

      if (initialData) {
        await axios.patch(`/api/appointments/${initialData.id}`, payload, {
          headers,
        })
      } else {
        await axios.post('/api/appointments', payload, { headers })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-commission'] })
      queryClient.invalidateQueries({ queryKey: ['daily-commission'] })
      queryClient.invalidateQueries({ queryKey: ['daily-commissions'] })
      queryClient.invalidateQueries({ queryKey: ['professional-commission'] })
      queryClient.invalidateQueries({ queryKey: ['professional'] })
      queryClient.invalidateQueries({ queryKey: ['financial'] })

      const eventType = initialData
        ? 'appointmentUpdated'
        : 'appointmentCreated'
      window.dispatchEvent(
        new CustomEvent(eventType, {
          detail: {
            professionalId: currentProfessionalId,
            isScheduled,
            timestamp: Date.now(),
          },
        })
      )

      const action = initialData ? 'atualizado' : 'criado'
      const type = isScheduled ? 'Agendamento' : 'Comanda'
      toast.success(`${type} ${action} com sucesso!`)
      onSuccess()
    },
    onError: (error: any) => {
      const action = initialData
        ? 'atualizar'
        : isScheduled
        ? 'criar agendamento'
        : 'registrar atendimento'
      const errorMessage =
        error.response?.data?.message || error.message || `Erro ao ${action}`

      if (errorMessage.includes('Já existe um agendamento')) {
        toast.error(errorMessage, {
          description: 'Escolha outro horário ou profissional',
          duration: 5000,
        })
      } else {
        toast.error(errorMessage)
      }
    },
  })

  return {
    form,
    mutation,
    currentProfessionalId,
  }
}
