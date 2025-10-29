import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ClientForm } from '@/components/custom/client/ClientForm'

const schema = z.object({
  branchId: z.string().optional(),
  professionalId: z.string().min(1, 'Selecione um profissional'),
  clientId: z.string().min(1, 'Selecione um cliente'),
  serviceIds: z.array(z.string()).min(1, 'Selecione ao menos um serviço'),
  scheduledDate: z.string().min(1, 'Selecione uma data'),
  scheduledTime: z.string().min(1, 'Selecione um horário'),
})

type FormData = z.infer<typeof schema>

interface AppointmentFormProps {
  onSuccess: () => void
}

export function AppointmentForm({ onSuccess }: AppointmentFormProps) {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const { isAdmin } = useUser()
  const [clientModalOpen, setClientModalOpen] = React.useState(false)

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      branchId: activeBranch?.id || '',
      professionalId: '',
      clientId: '',
      serviceIds: [],
      scheduledDate: '',
      scheduledTime: '',
    },
  })

  const watchedBranch = watch('branchId')
  const watchedProfessional = watch('professionalId')
  const watchedDate = watch('scheduledDate')
  const watchedServices = watch('serviceIds')

  const selectedBranchId = isAdmin ? watchedBranch : activeBranch?.id

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
    enabled: isAdmin,
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', selectedBranchId],
    queryFn: async () => {
      const res = await axios.get('/api/professionals', {
        params: selectedBranchId ? { branchId: selectedBranchId } : {},
      })
      return res.data
    },
    enabled: !!selectedBranchId,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', selectedBranchId],
    queryFn: async () => {
      const res = await axios.get('/api/clients', {
        params: selectedBranchId ? { branchId: selectedBranchId } : {},
      })
      return res.data
    },
    enabled: !!selectedBranchId,
  })

  const { data: services = [] } = useQuery({
    queryKey: ['services', selectedBranchId],
    queryFn: async () => {
      const res = await axios.get('/api/services', {
        params: selectedBranchId ? { branchId: selectedBranchId } : {},
      })
      return res.data.map((s: any) => ({
        ...s,
        price: Number(s.price),
      }))
    },
    enabled: !!selectedBranchId,
  })

  const { data: availableSlots = [] } = useQuery({
    queryKey: ['available-slots', watchedProfessional, watchedDate],
    queryFn: async () => {
      if (!watchedProfessional || !watchedDate) {return []}
      const res = await axios.get(`/api/appointments/available-slots/${watchedProfessional}/${watchedDate}`)
      return res.data
    },
    enabled: !!watchedProfessional && !!watchedDate,
  })

  const createAppointment = useMutation({
    mutationFn: async (data: FormData) => {
      // Compensar diferença de fuso horário do backend (adicionar 3 horas)
      const [hours, minutes] = data.scheduledTime.split(':')
      const adjustedHours = String((parseInt(hours) + 3) % 24).padStart(2, '0')
      const scheduledAt = `${data.scheduledDate}T${adjustedHours}:${minutes}:00.000Z`
      
      const appointmentDate = new Date(data.scheduledDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      appointmentDate.setHours(0, 0, 0, 0)
      
      const status = appointmentDate <= today ? 'COMPLETED' : 'SCHEDULED'
      
      const config = isAdmin && data.branchId ? {
        headers: { 'x-branch-id': data.branchId },
      } : {}
      
      await axios.post('/api/appointments', {
        professionalId: data.professionalId,
        clientId: data.clientId,
        serviceIds: data.serviceIds,
        scheduledAt,
        status,
      }, config)
    },
    onSuccess: () => {
      toast.success('Agendamento criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar agendamento')
    },
  })

  const total = services
    .filter((s: any) => watchedServices.includes(s.id))
    .reduce((sum: number, s: any) => sum + Number(s.price), 0)

  const onSubmit = (data: FormData) => {
    createAppointment.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Filial
          </label>
          <Controller
            name="branchId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
              >
                <option value="">Selecione a filial...</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.branchId && (
            <p className="text-xs text-destructive mt-1">{errors.branchId.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Data
        </label>
        <Controller
          name="scheduledDate"
          control={control}
          render={({ field }) => (
            <input
              type="date"
              {...field}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            />
          )}
        />
        {errors.scheduledDate && (
          <p className="text-xs text-destructive mt-1">{errors.scheduledDate.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Profissional
        </label>
        <Controller
          name="professionalId"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            >
              <option value="">Selecione um profissional...</option>
              {professionals.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        />
        {errors.professionalId && (
          <p className="text-xs text-destructive mt-1">{errors.professionalId.message}</p>
        )}
      </div>

      {availableSlots.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Horário
          </label>
          <Controller
            name="scheduledTime"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
              >
                <option value="">Selecione um horário...</option>
                {availableSlots.map((slot: string) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.scheduledTime && (
            <p className="text-xs text-destructive mt-1">{errors.scheduledTime.message}</p>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">
            Cliente
          </label>
          <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-sm text-primary hover:opacity-80 font-medium flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                Novo Cliente
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto bg-card">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <ClientForm onSuccess={() => setClientModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        />
        {errors.clientId && (
          <p className="text-xs text-destructive mt-1">{errors.clientId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Serviços
        </label>
        <Controller
          name="serviceIds"
          control={control}
          render={({ field }) => (
            <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-xl p-3">
              {services.map((s: any) => (
                <div key={s.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value.includes(s.id)}
                    onChange={(e) => {
                      const set = new Set(field.value)
                      e.target.checked ? set.add(s.id) : set.delete(s.id)
                      field.onChange(Array.from(set))
                    }}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-foreground">
                    {s.name} - R$ {Number(s.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        />
        {errors.serviceIds && (
          <p className="text-xs text-destructive mt-1">{errors.serviceIds.message}</p>
        )}
      </div>

      {total > 0 && (
        <div className="font-semibold text-sm bg-muted p-3 rounded-xl">
          Total: R$ {total.toFixed(2)}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full p-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        {isSubmitting ? 'Salvando...' : 'Agendar'}
      </button>
    </form>
  )
}