import React, { useState } from 'react'
import { useCreatePublicAppointment } from '@/hooks/usePublicBooking'
import { toast } from 'sonner'
import { BookingSuccess } from './BookingSuccess'

interface BookingConfirmationProps {
  service: any
  professional: any
  dateTime: any
  client: any
  branchId: string
  businessName: string
  branchName: string
  onBack: () => void
}

export function BookingConfirmation({ 
  service, 
  professional, 
  dateTime, 
  client, 
  branchId,
  businessName,
  branchName,
  onBack 
}: BookingConfirmationProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const createAppointment = useCreatePublicAppointment()

  const handleConfirm = async () => {
    try {
      await createAppointment.mutateAsync({
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        serviceId: service.id,
        professionalId: professional.id,
        scheduledAt: dateTime.datetime,
        branchId
      })
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
          service,
          professional,
          dateTime
        }}
        businessName={businessName}
        branchName={branchName}
      />
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Confirmar agendamento</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <p><strong>Serviço:</strong> {service.name}</p>
        <p><strong>Profissional:</strong> {professional.name}</p>
        <p><strong>Data/Hora:</strong> {dateTime.date} às {dateTime.time}</p>
        <p><strong>Cliente:</strong> {client.name}</p>
        <p><strong>Telefone:</strong> {client.phone}</p>
        <p><strong>Valor:</strong> R$ {service.price}</p>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="px-4 py-2 border rounded">
          Voltar
        </button>
        <button 
          onClick={handleConfirm}
          disabled={createAppointment.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createAppointment.isPending ? 'Confirmando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}