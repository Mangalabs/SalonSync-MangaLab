import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface BookingSuccessProps {
  appointment: {
    client: { name: string; phone: string }
    service: { name: string; price: string }
    professional: { name: string }
    dateTime: { date: string; time: string }
  }
  businessName: string
  branchName: string
}

export function BookingSuccess({ appointment, businessName, branchName }: BookingSuccessProps) {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Try to close window, if it fails, redirect to home
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-3xl p-8 shadow-xl border border-border text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Agendamento Confirmado!
          </h1>
          <p className="text-muted-foreground mb-6">
            Seu agendamento foi realizado com sucesso
          </p>

          {/* Appointment Details */}
          <div className="bg-muted/50 rounded-2xl p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{appointment.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium">{appointment.service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profissional:</span>
                <span className="font-medium">{appointment.professional.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data/Hora:</span>
                <span className="font-medium">{appointment.dateTime.date} às {appointment.dateTime.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local:</span>
                <span className="font-medium">{businessName} - {branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium text-green-600">R$ {appointment.service.price}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium mb-1">
              Confirmação enviada para:
            </p>
            <p className="text-sm text-blue-700">
              {appointment.client.phone}
            </p>
          </div>

          {/* Countdown */}
          <div className="text-center">
            {countdown > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Redirecionando em {countdown} segundos
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <button
                onClick={() => window.location.href = '/'}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl hover:opacity-80 transition-opacity"
              >
                Voltar ao início
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}