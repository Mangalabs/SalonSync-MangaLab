import { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'

const createSchema = (isAdmin: boolean, isScheduled: boolean) => {
  const baseSchema = {
    professionalId: z.string().min(1, 'Selecione um profissional'),
    clientId: z.string().min(1, 'Selecione um cliente'),
    serviceIds: z.array(z.string()).min(1, 'Selecione ao menos um serviço'),
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
  initialData?: any,
) {
  const queryClient = useQueryClient()
  const { user, isProfessional, isAdmin } = useUser()
  const isScheduled = mode === 'scheduled'

  const getDefaultValues = () => {
    if (initialData) {
      const scheduledAt = new Date(initialData.scheduledAt)
      return {
        professionalId: initialData.professionalId || initialData.professional?.id || '',
        clientId: initialData.clientId || initialData.client?.id || '',
        serviceIds: initialData.appointmentServices?.map((as: any) => as.service.id) || [],
        ...(isScheduled && {
          scheduledDate: scheduledAt.toISOString().split('T')[0],
          scheduledTime: scheduledAt.toTimeString().slice(0, 5),
        }),
        ...(isAdmin && { branchId: initialData.branchId || '' }),
      }
    }
    
    return isScheduled ? {
      professionalId: '', 
      clientId: '', 
      serviceIds: [],
      scheduledDate: '',
      scheduledTime: '',
      ...(isAdmin && { branchId: '' }),
    } : {
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
    if (isProfessional && !isAdmin && user?.name && professionals.length > 0) {
      const currentProfessional = professionals.find(p => p.name === user.name)
      return currentProfessional?.id || ''
    }
    return ''
  }, [isProfessional, isAdmin, user?.name, professionals])
  
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
        // Criar data no horário local para evitar problemas de fuso horário
        const localDate = new Date(`${data.scheduledDate}T${data.scheduledTime}:00`)
        scheduledAt = localDate.toISOString()
        status = 'SCHEDULED'
      } else {
        scheduledAt = new Date().toISOString()
        status = 'COMPLETED'
      }
      
      let finalProfessionalId = (isProfessional && !isAdmin) ? currentProfessionalId : data.professionalId
      
      if (isProfessional && !isAdmin && !finalProfessionalId && user?.name) {
        const professional = professionals.find(p => p.name === user.name)
        finalProfessionalId = professional?.id || ''
      }
      
      const payload = {
        clientId: data.clientId,
        professionalId: finalProfessionalId,
        serviceIds: data.serviceIds,
        scheduledAt,
        status,
      }
      
      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {}
      
      if (initialData) {
        await axios.patch(`/api/appointments/${initialData.id}`, payload, { headers })
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
      queryClient.invalidateQueries({ queryKey: ['professional'] })
      queryClient.invalidateQueries({ queryKey: ['financial'] })
      
      const action = initialData ? 'atualizado' : 'criado'
      const type = isScheduled ? 'Agendamento' : 'Atendimento'
      toast.success(`${type} ${action} com sucesso!`)
      onSuccess()
    },
    onError: (error: any) => {
      const action = initialData ? 'atualizar' : (isScheduled ? 'criar agendamento' : 'registrar atendimento')
      const errorMessage = error.response?.data?.message || error.message || `Erro ao ${action}`
      
      // Mostrar mensagem específica para conflitos de horário
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