import React, { useState } from 'react'
import { Search, UserPlus, Save, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

// eslint-disable-next-line import/namespace
import { useFormQueries } from '@/hooks/useFormQueries'
import { useAppointmentForm } from '@/hooks/useAppointmentForm'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import axios from '@/lib/axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ClientForm } from '@/components/custom/client/ClientForm'

export default function NewAppointment() {
  const { isAdmin } = useUser()
  const { activeBranch } = useBranch()
  const [clientModalOpen, setClientModalOpen] = useState(false)

  useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
    enabled: isAdmin,
  })

  const { professionals } = useFormQueries()
  const { form, mutation } = useAppointmentForm('scheduled', professionals, () => {})

  const { handleSubmit, watch, setValue, formState: { isSubmitting } } = form

  React.useEffect(() => {
    if (activeBranch?.id) {
      setValue('branchId', activeBranch.id)
    }
  }, [activeBranch?.id, setValue])

  const selectedBranchId = watch('branchId')
  const selectedProfessional = watch('professionalId')
  const selectedDate = watch('scheduledDate' as any)

  const branchData = useFormQueries(selectedProfessional, selectedDate, true, selectedBranchId)
  const { availableSlots, services = [], clients = [], professionals: profs = [] } = branchData

  const watchedServices = watch('serviceIds') || []
  const selectedServices = (Array.isArray(services) ? services : []).filter((s) => watchedServices.includes(s.id))
  const totalDuration = selectedServices.reduce((acc, s) => acc + (s.duration || 0), 0)
  const totalPrice = selectedServices.reduce((acc, s) => acc + (s.price || 0), 0)

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) {return `${remainingMinutes}min`}
    if (remainingMinutes === 0) {return `${hours}h`}
    return `${hours}h ${remainingMinutes}min`
  }

  const onSubmit = (data: any) => {
    if (activeBranch?.id) {data.branchId = activeBranch.id}
    mutation.mutate(data)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Registrar Novo Atendimento</h3>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                          <p className="text-sm text-gray-500">{service.duration} min</p>
                        </div>
                      </div>
                      <span className="font-semibold text-purple-600">
                        R$ {service.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
              <input
                type="date"
                value={watch('scheduledDate') || ''}
                onChange={(e) => setValue('scheduledDate', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Horário</label>
              <select
                value={watch('scheduledTime') || ''}
                onChange={(e) => setValue('scheduledTime', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
              >
                <option value="">Selecione o horário</option>
                {availableSlots?.map((slot: string) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <textarea
              rows={3}
              placeholder="Observações sobre o atendimento..."
              value={watch('notes') || ''}
              onChange={(e) => setValue('notes', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-gray-50"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : 'Registrar Atendimento'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Resumo do Atendimento</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Serviços:</span>
              <span className="font-semibold">{selectedServices.length} selecionados</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duração Total:</span>
              <span className="font-semibold">{formatDuration(totalDuration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">Total:</span>
                <span className="font-bold text-purple-600 text-lg">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Horários Disponíveis Hoje</h4>
          <div className="grid grid-cols-2 gap-2">
            {availableSlots?.map((time: string) => (
              <button
                key={time}
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
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Horários em cinza não estão disponíveis
          </p>
        </div>
      </div>
    </div>
  )
}
