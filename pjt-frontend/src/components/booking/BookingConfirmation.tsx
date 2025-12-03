import React, { useState } from 'react'
import { toast } from 'sonner'

import { useCreatePublicAppointment } from '@/hooks/usePublicBooking'

import { BookingSuccess } from './BookingSuccess'

interface BookingConfirmationProps {
  services: any[]
  professional: any
  dateTime: any
  client: any
  branchId: string
  businessName: string
  branchName: string
  onBack: () => void
}

export function BookingConfirmation({
  services,
  professional,
  dateTime,
  client,
  branchId,
  businessName,
  branchName,
  onBack,
}: BookingConfirmationProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const createAppointment = useCreatePublicAppointment()

  const getTotalPrice = () => {
    return services.reduce(
      (total, service) => total + parseFloat(service.price),
      0
    )
  }

  const handleConfirm = async () => {
    try {
      const appointmentData = {
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        serviceId: services[0].id,
        serviceIds: services.map((s) => s.id),
        professionalId: professional.id,
        scheduledAt: dateTime.datetime,
        branchId,
      }

      await createAppointment.mutateAsync(appointmentData)
      setShowSuccess(true)
    } catch (error) {
      toast.error('Erro ao criar agendamento')
    }
  }

  if (showSuccess) {
    return (
      <BookingSuccess
        appointment={{
          client,
          services,
          professional,
          dateTime,
        }}
        businessName={businessName}
        branchName={branchName}
      />
    )
  }

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold'>Confirmar agendamento</h2>

      <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
        <div>
          <strong>Serviços:</strong>
          <ul className='mt-1 ml-4'>
            {services.map((service, index) => (
              <li key={service.id} className='flex justify-between'>
                <span>• {service.name}</span>
                <span>R$ {service.price}</span>
              </li>
            ))}
          </ul>
        </div>
        <p>
          <strong>Profissional:</strong> {professional.name}
        </p>
        <p>
          <strong>Data/Hora:</strong> {dateTime.date} às {dateTime.time}
        </p>
        <p>
          <strong>Cliente:</strong> {client.name}
        </p>
        <p>
          <strong>Telefone:</strong> {client.phone}
        </p>
        <p className='text-lg font-semibold text-green-600 border-t pt-2'>
          <strong>Total:</strong> R$ {getTotalPrice().toFixed(2)}
        </p>
      </div>

      <div className='flex gap-4'>
        <button onClick={onBack} className='px-4 py-2 border rounded'>
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={createAppointment.isPending}
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'>
          {createAppointment.isPending ? 'Confirmando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}
