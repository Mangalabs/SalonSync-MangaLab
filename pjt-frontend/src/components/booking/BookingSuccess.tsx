import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface BookingSuccessProps {
  appointment: {
    client: { name: string; phone: string }
    services: { name: string; price: string }[]
    professional: { name: string }
    dateTime: { date: string; time: string }
  }
  businessName: string
  branchName: string
}

export function BookingSuccess({
  appointment,
  businessName,
  branchName,
}: BookingSuccessProps) {
  const getTotalPrice = () => {
    return appointment.services.reduce(
      (total, service) => total + parseFloat(service.price),
      0
    )
  }
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (window.opener) {
            window.close()
          } else {
            window.location.href = '/'
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='max-w-md w-full'>
        <div className='bg-card rounded-3xl p-8 shadow-xl border border-border text-center'>
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <Check className='w-10 h-10 text-green-600' />
          </div>

          <h1 className='text-2xl font-bold text-foreground mb-2'>
            Agendamento Confirmado!
          </h1>
          <p className='text-muted-foreground mb-6'>
            Seu agendamento foi realizado com sucesso
          </p>

          <div className='bg-muted/50 rounded-2xl p-4 mb-6 text-left'>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Cliente:</span>
                <span className='font-medium'>{appointment.client.name}</span>
              </div>
              <div className='space-y-1'>
                <span className='text-muted-foreground'>Serviços:</span>
                {appointment.services.map((service, index) => (
                  <div key={index} className='flex justify-between ml-2'>
                    <span className='font-medium'>• {service.name}</span>
                    <span className='font-medium'>R$ {service.price}</span>
                  </div>
                ))}
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Profissional:</span>
                <span className='font-medium'>
                  {appointment.professional.name}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Data/Hora:</span>
                <span className='font-medium'>
                  {appointment.dateTime.date} às {appointment.dateTime.time}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Local:</span>
                <span className='font-medium'>
                  {businessName} - {branchName}
                </span>
              </div>
              <div className='flex justify-between border-t pt-2'>
                <span className='text-muted-foreground font-semibold'>
                  Total:
                </span>
                <span className='font-bold text-green-600'>
                  R$ {getTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className='text-center'>
            {countdown > 0 ? (
              <>
                <p className='text-sm text-muted-foreground'>
                  Redirecionando em {countdown} segundos
                </p>
                <div className='w-full bg-muted rounded-full h-2 mt-2'>
                  <div
                    className='bg-primary h-2 rounded-full transition-all duration-1000'
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <button
                onClick={() => (window.location.href = '/')}
                className='bg-primary text-primary-foreground px-6 py-2 rounded-xl hover:opacity-80 transition-opacity'>
                Voltar ao início
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
