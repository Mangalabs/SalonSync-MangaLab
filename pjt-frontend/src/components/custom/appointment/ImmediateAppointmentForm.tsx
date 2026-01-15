import React from 'react'
import { Save, ClipboardList } from 'lucide-react'

import { useAppointmentFormSetup } from '@/hooks/useAppointmentFormSetup'
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
  const {
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
    watchedServices,
    selectedServices,
    totalPrice,
  } = useAppointmentFormSetup({
    type: 'immediate',
    onSuccess,
    initialData,
  })

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      <div className='lg:col-span-2 bg-card rounded-2xl p-6 shadow-sm border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-6'>
          Iniciar Nova Comanda
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

          <div className='flex space-x-4'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity flex items-center justify-center gap-2 cursor-pointer'>
              <ClipboardList className='w-4 h-4' />
              {isSubmitting ? 'Criando...' : 'Iniciar Comanda'}
            </button>
          </div>
        </form>
      </div>

      <div className='space-y-6'>
        <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
          <h4 className='font-semibold text-foreground mb-4'>
            Sistema de Comanda
          </h4>
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <ClipboardList className='w-5 h-5 text-primary mt-0.5' />
              <div>
                <p className='text-sm font-medium text-foreground mb-1'>
                  Atendimento em Etapas
                </p>
                <p className='text-xs text-muted-foreground'>
                  Crie a comanda agora e adicione serviços/produtos durante o
                  atendimento
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-muted rounded-2xl p-6 border border-border'>
          <h4 className='font-semibold text-foreground mb-2'>Como Funciona</h4>
          <ol className='text-sm text-muted-foreground space-y-2'>
            <li className='flex items-start gap-2'>
              <span className='font-semibold text-primary'>1.</span>
              <span>Selecione o cliente e profissional</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='font-semibold text-primary'>2.</span>
              <span>Clique em "Iniciar Comanda"</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='font-semibold text-primary'>3.</span>
              <span>Adicione serviços e produtos conforme necessário</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='font-semibold text-primary'>4.</span>
              <span>Finalize o atendimento com o pagamento</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
