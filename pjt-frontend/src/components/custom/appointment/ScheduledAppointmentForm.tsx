import React, { useState } from 'react'
import { Search, UserPlus, Save, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { useFormQueries } from '@/hooks/useFormQueries'
import { useAppointmentForm } from '@/hooks/useAppointmentForm'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import axios from '@/lib/axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ClientForm } from '@/components/custom/client/ClientForm'
import { SchedulingFields } from '@/components/custom/scheduling/SchedulingFields'

interface ScheduledAppointmentFormProps {
  onSuccess?: () => void
  initialData?: any
}

export function ScheduledAppointmentForm({ onSuccess, initialData }: ScheduledAppointmentFormProps) {
  const { isAdmin } = useUser()
  const { activeBranch } = useBranch()
  const [clientModalOpen, setClientModalOpen] = useState(false)

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
    enabled: isAdmin,
  })

  const { professionals } = useFormQueries()
  const { form, mutation } = useAppointmentForm('scheduled', professionals, () => {
    onSuccess?.()
  }, initialData)

  const { handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = form

  React.useEffect(() => {
    if (!isAdmin && activeBranch?.id) {
      setValue('branchId', activeBranch.id)
    }
  }, [isAdmin, activeBranch?.id, setValue])

  const selectedBranchId = watch('branchId')
  const selectedProfessional = watch('professionalId')
  const selectedDate = watch('scheduledDate')

  const branchData = useFormQueries(selectedProfessional, selectedDate, true, selectedBranchId)
  const { services = [], clients = [], professionals: profs = [], availableSlots = [] } = branchData

  const watchedServices = watch('serviceIds') || []
  const selectedServices = (Array.isArray(services) ? services : []).filter((s) => watchedServices.includes(s.id))
  const totalPrice = selectedServices.reduce((acc, s) => acc + (s.price || 0), 0)

  const onSubmit = (data: any) => {
    mutation.mutate(data)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {initialData ? 'Editar Agendamento' : 'Novo Agendamento'}
        </h3>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filial</label>
              <select
                value={selectedBranchId || ''}
                onChange={(e) => {
                  setValue('branchId', e.target.value)
                  setValue('professionalId', '')
                  setValue('clientId', '')
                  setValue('serviceIds', [])
                }}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
              >
                <option value="">Selecione uma filial</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              {errors.branchId && (
                <p className="text-xs text-red-500 mt-1">{errors.branchId.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={watch('clientId') || ''}
                  onChange={(e) => setValue('clientId', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                >
                  <option value="">Buscar cliente...</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {errors.clientId && (
                <p className="text-xs text-red-500 mt-1">{errors.clientId.message}</p>
              )}

              <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Novo Cliente
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                  </DialogHeader>
                  <ClientForm
                    onSuccess={() => setClientModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profissional</label>
              <select
                value={watch('professionalId') || ''}
                onChange={(e) => setValue('professionalId', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
              >
                <option value="">Selecione o profissional</option>
                {profs.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.professionalId && (
                <p className="text-xs text-red-500 mt-1">{errors.professionalId.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Serviços</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((service: any) => {
                const selected = watchedServices.includes(service.id)
                return (
                  <div
                    key={service.id}
                    onClick={() => {
                      const newList = selected
                        ? watchedServices.filter((id: string) => id !== service.id)
                        : [...watchedServices, service.id]
                      setValue('serviceIds', newList)
                    }}
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      selected
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            const newList = selected
                              ? watchedServices.filter((id: string) => id !== service.id)
                              : [...watchedServices, service.id]
                            setValue('serviceIds', newList)
                          }}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{service.name}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-purple-600">
                        R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {errors.serviceIds && (
              <p className="text-xs text-red-500 mt-1">{errors.serviceIds.message}</p>
            )}
          </div>

          <SchedulingFields
            control={form.control}
            errors={errors}
            availableSlots={availableSlots}
            selectedProfessional={selectedProfessional || ''}
            selectedDate={selectedDate || ''}
          />

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Agendamento' : 'Agendar')}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Resumo do Agendamento</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Serviços:</span>
              <span className="font-semibold">{selectedServices.length} selecionados</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">Total:</span>
                <span className="font-bold text-purple-600 text-lg">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Horários Disponíveis</h4>
          <div className="grid grid-cols-2 gap-2">
            {availableSlots.map((time: string) => (
              <button
                key={time}
                type="button"
                onClick={() => setValue('scheduledTime', time)}
                className={`p-2 text-sm rounded-lg transition-colors ${
                  watch('scheduledTime') === time
                    ? 'bg-purple-100 border-purple-300 text-purple-700 border-2'
                    : 'border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          {availableSlots.length === 0 && selectedProfessional && selectedDate && (
            <div className="text-center py-4">
              <p className="text-sm text-amber-600 font-medium">🚫 Todos os horários estão ocupados</p>
              <p className="text-xs text-amber-700 mt-1">Escolha outra data ou profissional</p>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Horários em cinza não estão disponíveis
          </p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2">Agendamento</h4>
          <p className="text-sm text-purple-700">
            Este agendamento ficará pendente até ser confirmado no dia do atendimento.
          </p>
        </div>
      </div>
    </div>
  )
}