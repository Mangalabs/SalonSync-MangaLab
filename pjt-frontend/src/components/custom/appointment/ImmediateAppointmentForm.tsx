import React, { useState } from 'react'
import { Search, UserPlus, Save } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { useFormQueries } from '@/hooks/useFormQueries'
import { useAppointmentForm } from '@/hooks/useAppointmentForm'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import axios from '@/lib/axios'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ClientForm } from '@/components/custom/client/ClientForm'

interface ImmediateAppointmentFormProps {
  onSuccess?: () => void
}

export function ImmediateAppointmentForm({
  onSuccess,
}: ImmediateAppointmentFormProps) {
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
  const { form, mutation } = useAppointmentForm(
    'immediate',
    professionals,
    () => {
      onSuccess?.()
    },
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
    selectedBranchId,
  )
  const { services = [], clients = [], professionals: profs = [] } = branchData

  const watchedServices = watch('serviceIds') || []
  const selectedServices = (Array.isArray(services) ? services : []).filter(
    (s) => watchedServices.includes(s.id),
  )
  const totalPrice = selectedServices.reduce(
    (acc, s) => acc + (s.price || 0),
    0,
  )

  const onSubmit = (data: any) => {
    mutation.mutate(data)
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      <div className='lg:col-span-2 bg-card rounded-2xl p-6 shadow-sm border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-6'>
          Registrar Atendimento Imediato
        </h3>
        <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
          {isAdmin && (
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                Filial
              </label>
              <select
                value={selectedBranchId || ''}
                onChange={(e) => {
                  setValue('branchId', e.target.value)
                  setValue('professionalId', '')
                  setValue('clientId', '')
                  setValue('serviceIds', [])
                }}
                className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
                <option value=''>Selecione uma filial</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.branchId.message}
                </p>
              )}
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                Cliente
              </label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5' />
                <select
                  value={watch('clientId') || ''}
                  onChange={(e) => setValue('clientId', e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
                  <option value=''>Buscar cliente...</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.clientId && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.clientId.message}
                </p>
              )}

              <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
                <DialogTrigger asChild>
                  <button
                    type='button'
                    className='mt-2 text-sm text-primary hover:opacity-80 font-medium flex items-center gap-1'>
                    <UserPlus className='w-4 h-4' />
                    Novo Cliente
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                  </DialogHeader>
                  <ClientForm onSuccess={() => setClientModalOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                Profissional
              </label>
              <select
                value={watch('professionalId') || ''}
                onChange={(e) => setValue('professionalId', e.target.value)}
                className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'>
                <option value=''>Selecione o profissional</option>
                {profs.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.professionalId && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.professionalId.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-3'>
              Serviços Realizados
            </label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {services.map((service: any) => {
                const selected = watchedServices.includes(service.id)
                return (
                  <div
                    key={service.id}
                    onClick={() => {
                      const newList = selected
                        ? watchedServices.filter(
                          (id: string) => id !== service.id,
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
                                (id: string) => id !== service.id,
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
              {isSubmitting ? 'Registrando...' : 'Registrar Atendimento'}
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
            Atendimento Imediato
          </h4>
          <p className='text-sm text-muted-foreground'>
            Este atendimento será registrado como concluído automaticamente,
            gerando receita e comissão na data atual.
          </p>
        </div>
      </div>
    </div>
  )
}