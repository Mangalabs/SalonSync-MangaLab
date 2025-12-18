import React from 'react'
import { Save } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { useFormQueries } from '@/hooks/useFormQueries'
import { useAppointmentForm } from '@/hooks/useAppointmentForm'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import axios from '@/lib/axios'

import { ClientSearchInput } from '@/components/custom/client/ClientSearchInput'
import { ProfessionalInput } from '@/components/custom/professional/ProfessionalInput'
import { BranchSelect } from '@/components/custom/branch/BranchSelect'

interface ImmediateAppointmentFormProps {
  onSuccess?: () => void
  initialData?: any
}

export function ImmediateAppointmentForm({
  onSuccess,
  initialData,
}: ImmediateAppointmentFormProps) {
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
    'immediate',
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
  const branchData = useFormQueries(
    undefined,
    undefined,
    false,
    selectedBranchId
  )
  const { services = [], clients = [], professionals: profs = [] } = branchData

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
          {initialData
            ? 'Editar Atendimento'
            : 'Registrar Atendimento Imediato'}
        </h3>
        <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
          {isAdmin && (
            <BranchSelect
              id='immediate-branch-select'
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
              id='immediate-client-search'
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
                htmlFor='immediate-professional-select'
                className='block text-sm font-medium text-foreground mb-2'>
                Profissional
              </label>
              <ProfessionalInput
                id='immediate-professional-select'
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
            <label className='block text-sm font-medium text-foreground mb-2'>
              Método de Pagamento
            </label>
            <select
              value={watch('paymentMethod') || 'CASH'}
              onChange={(e) => setValue('paymentMethod', e.target.value)}
              className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
              <option value='CASH'>Dinheiro</option>
              <option value='CARD'>Cartão</option>
              <option value='PIX'>PIX</option>
              <option value='TRANSFER'>Transferência</option>
              <option value='OTHER'>Outros</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-3'>
              Serviços Realizados
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
                        ? 'border-primary bg-accent/20'
                        : 'border-border hover:border-primary hover:bg-accent/10'
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

          <div className='flex space-x-4'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity flex items-center justify-center gap-2 cursor-pointer'>
              <Save className='w-4 h-4' />
              {isSubmitting
                ? initialData
                  ? 'Atualizando...'
                  : 'Registrando...'
                : initialData
                ? 'Atualizar Atendimento'
                : 'Registrar Atendimento'}
            </button>
          </div>
        </form>
      </div>

      <div className='space-y-6'>
        <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
          <h4 className='font-semibold text-foreground mb-4'>
            Resumo do Atendimento
          </h4>
          <div className='space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Serviços:</span>
              <span className='font-semibold'>
                {selectedServices.length} realizados
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

        <div className='bg-muted rounded-2xl p-6 border border-border'>
          <h4 className='font-semibold text-foreground mb-2'>
            {initialData ? 'Edição de Atendimento' : 'Atendimento Imediato'}
          </h4>
          <p className='text-sm text-muted-foreground'>
            {initialData
              ? 'Edite os dados do atendimento conforme necessário.'
              : 'Este atendimento será registrado como concluído automaticamente, gerando receita e comissão na data atual.'}
          </p>
        </div>
      </div>
    </div>
  )
}
