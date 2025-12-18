import React, { useState } from 'react'
import { Save, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { useFormQueries } from '@/hooks/useFormQueries'
import { useAppointmentForm } from '@/hooks/useAppointmentForm'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import axios from '@/lib/axios'

import { ClientSearchInput } from '@/components/custom/client/ClientSearchInput'
import { SchedulingFields } from '@/components/custom/scheduling/SchedulingFields'
import { ProfessionalInput } from '@/components/custom/professional/ProfessionalInput'
import { BranchSelect } from '@/components/custom/branch/BranchSelect'

interface ScheduledAppointmentFormProps {
  onSuccess?: () => void
  initialData?: any
}

export function ScheduledAppointmentForm({
  onSuccess,
  initialData,
}: ScheduledAppointmentFormProps) {
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
    'scheduled',
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

  React.useEffect(() => {
    if (!isAdmin && activeBranch?.id) {
      setValue('branchId', activeBranch.id)
    }
  }, [isAdmin, activeBranch?.id, setValue])

  const selectedBranchId = watch('branchId')
  const selectedProfessional = watch('professionalId')
  const selectedDate = watch('scheduledDate')

  const branchData = useFormQueries(
    selectedProfessional,
    selectedDate,
    true,
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
    (s) => watchedServices.includes(s.id)
  )
  const totalPrice = selectedServices.reduce(
    (acc, s) => acc + (s.price || 0),
    0
  )

  const onSubmit = (data: any) => {
    mutation.mutate(data)
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      <div className='lg:col-span-2 bg-card rounded-2xl p-6 shadow-sm border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-6'>
          {initialData ? 'Editar Agendamento' : 'Novo Agendamento'}
        </h3>
        <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
          {isAdmin && (
            <BranchSelect
              id='scheduled-branch-select'
              value={selectedBranchId || ''}
              onChange={(branchId) => setValue('branchId', branchId)}
              branches={branches}
              error={errors.branchId?.message as string}
              onBranchChange={() => {
                setValue('professionalId', '')
                setValue('clientId', '')
                setValue('serviceIds', [])
              }}
            />
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <ClientSearchInput
              id='scheduled-client-search'
              value={watch('clientId') || ''}
              onChange={(clientId) => setValue('clientId', clientId)}
              clients={(Array.isArray(clients) ? clients : []).map(
                (c: any) => ({
                  id: c.id,
                  name: c.name,
                })
              )}
              error={errors.clientId?.message as string}
            />

            <div>
              <label
                htmlFor='scheduled-professional-select'
                className='block text-sm font-medium text-foreground mb-2'>
                Profissional
              </label>
              <ProfessionalInput
                id='scheduled-professional-select'
                value={watch('professionalId') || ''}
                onChange={(value) => setValue('professionalId', value)}
                professionals={(Array.isArray(profs) ? profs : []).map(
                  (p: any) => ({
                    id: p.id,
                    name: p.name,
                  })
                )}
              />
              {errors.professionalId && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.professionalId.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-3'>
              Serviços
            </label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {(Array.isArray(services) ? services : []).map((service: any) => {
                const selected = watchedServices.includes(service.id)
                return (
                  <div
                    key={service.id}
                    onClick={() => {
                      const newList = selected
                        ? watchedServices.filter(
                            (id: string) => id !== service.id
                          )
                        : [...watchedServices, service.id]
                      setValue('serviceIds', newList)
                    }}
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      selected
                        ? 'border-secondary bg-muted'
                        : 'border-border hover:border-secondary hover:bg-muted'
                    }`}>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={selected}
                          onChange={() => {
                            const newList = selected
                              ? watchedServices.filter(
                                  (id: string) => id !== service.id
                                )
                              : [...watchedServices, service.id]
                            setValue('serviceIds', newList)
                          }}
                          className='w-4 h-4 text-primary rounded'
                        />
                        <div>
                          <p className='font-medium text-foreground'>
                            {service.name}
                          </p>
                        </div>
                      </div>
                      <span className='font-semibold text-primary'>
                        R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {errors.serviceIds && (
              <p className='text-xs text-destructive mt-1'>
                {errors.serviceIds.message}
              </p>
            )}
          </div>

          <SchedulingFields
            control={form.control}
            errors={errors}
            availableSlots={availableSlots}
            selectedProfessional={selectedProfessional || ''}
            selectedDate={selectedDate || ''}
          />

          <div className='flex space-x-4'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-60 transition-opacity flex items-center justify-center gap-2 cursor-pointer'>
              <Save className='w-4 h-4' />
              {isSubmitting
                ? 'Salvando...'
                : initialData
                ? 'Atualizar Agendamento'
                : 'Agendar'}
            </button>
          </div>
        </form>
      </div>

      <div className='space-y-6'>
        <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
          <h4 className='font-semibold text-foreground mb-4'>
            Resumo do Agendamento
          </h4>
          <div className='space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Serviços:</span>
              <span className='font-semibold'>
                {selectedServices.length} selecionados
              </span>
            </div>
            <div className='border-t border-border pt-2'>
              <div className='flex justify-between'>
                <span className='font-semibold text-foreground'>Total:</span>
                <span className='font-bold text-primary text-lg'>
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
          <h4 className='font-semibold text-foreground mb-4'>
            Horários Disponíveis
          </h4>
          {(() => {
            const [selectedHour, setSelectedHour] = useState('')

            const availableHours = [
              ...new Set(
                (Array.isArray(availableSlots) ? availableSlots : []).map(
                  (slot) => slot.split(':')[0]
                )
              ),
            ]

            const availableMinutes = selectedHour
              ? (Array.isArray(availableSlots) ? availableSlots : []).filter(
                  (slot) => slot.startsWith(selectedHour + ':')
                )
              : []

            return (
              <>
                <div className='mb-4'>
                  <p className='text-sm font-medium text-foreground mb-2'>
                    1. Selecione a hora:
                  </p>
                  <div className='grid grid-cols-3 gap-2'>
                    {availableHours.map((hour: string) => (
                      <button
                        key={hour}
                        type='button'
                        onClick={() => {
                          setSelectedHour(hour)
                          const hourSlots = (
                            Array.isArray(availableSlots) ? availableSlots : []
                          ).filter((slot) => slot.startsWith(hour + ':'))
                          if (hourSlots.length === 1) {
                            setValue('scheduledTime', hourSlots[0])
                          }
                        }}
                        className={`p-3 text-sm rounded-lg transition-colors ${
                          selectedHour === hour
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border hover:border-secondary hover:bg-muted'
                        }`}>
                        {hour}:00
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seleção de Minutos */}
                {selectedHour && availableMinutes.length > 1 && (
                  <div className='mb-4'>
                    <p className='text-sm font-medium text-foreground mb-2'>
                      2. Selecione os minutos:
                    </p>
                    <div className='grid grid-cols-3 gap-2'>
                      {availableMinutes.map((time: string) => {
                        const minutes = time.split(':')[1]
                        return (
                          <button
                            key={time}
                            type='button'
                            onClick={() => setValue('scheduledTime', time)}
                            className={`p-2 text-sm rounded-lg transition-colors ${
                              watch('scheduledTime') === time
                                ? 'bg-secondary border-secondary text-secondary-foreground border-2'
                                : 'border border-border hover:border-secondary hover:bg-muted'
                            }`}>
                            :{minutes}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Horário Selecionado */}
                {watch('scheduledTime') && (
                  <div className='bg-muted rounded-lg p-3 text-center'>
                    <p className='text-sm text-muted-foreground'>
                      Horário selecionado:
                    </p>
                    <p className='text-lg font-semibold text-primary'>
                      {watch('scheduledTime')}
                    </p>
                  </div>
                )}
              </>
            )
          })()}
          {availableSlots.length === 0 &&
            selectedProfessional &&
            selectedDate && (
              <div className='text-center py-4'>
                <p className='text-sm text-destructive font-medium'>
                  🚫 Todos os horários estão ocupados
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Escolha outra data ou profissional
                </p>
              </div>
            )}
        </div>

        <div className='bg-muted rounded-2xl p-6 border border-border'>
          <h4 className='font-semibold text-foreground mb-2'>Agendamento</h4>
          <p className='text-sm text-muted-foreground'>
            Este agendamento ficará pendente até ser confirmado no dia do
            atendimento.
          </p>
        </div>
      </div>
    </div>
  )
}
