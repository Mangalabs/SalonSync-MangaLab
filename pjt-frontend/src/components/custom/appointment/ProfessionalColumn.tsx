import React from 'react'
import { Clock, User } from 'lucide-react'

import { AppointmentQueueCard } from './AppointmentQueueCard'
import { ProfessionalStatus } from './ProfessionalStatus'

interface ProfessionalColumnProps {
  professionalStats: any
  selectedDate: Date
  queueCalculations: any
}

export function ProfessionalColumn({
  professionalStats,
  selectedDate,
  queueCalculations,
}: ProfessionalColumnProps) {
  const { formatTimeRemaining, isToday } = queueCalculations

  const {
    professionalId,
    professionalName,
    currentAppointment,
    upcomingAppointments,
    stats,
    status,
    nextAvailableTime,
  } = professionalStats

  const totalAppointments =
    (currentAppointment ? 1 : 0) + upcomingAppointments.length

  return (
    <div className='bg-muted/50 rounded-xl p-4 border border-border'>
      {/* Header do Profissional */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-secondary rounded-full flex items-center justify-center'>
            <User className='w-4 h-4 text-secondary-foreground' />
          </div>
          <div>
            <h4 className='font-semibold text-foreground text-sm'>
              {professionalName}
            </h4>
            <p className='text-xs text-muted-foreground'>
              {totalAppointments} agendamento
              {totalAppointments !== 1 ? 's' : ''}
              {stats.completedToday > 0 && (
                <span className='ml-2 text-green-600'>
                  • {stats.completedToday} concluídos
                </span>
              )}
            </p>
          </div>
        </div>

        <ProfessionalStatus status={status} stats={stats} isToday={isToday} />
      </div>

      {/* Próxima Disponibilidade */}
      {isToday && nextAvailableTime && (
        <div className='mb-4 p-2 bg-card rounded-lg border border-border'>
          <div className='flex items-center justify-between text-xs'>
            <div className='flex items-center gap-2'>
              <Clock className='w-3 h-3 text-muted-foreground' />
              <span className='text-muted-foreground'>Próximo livre:</span>
              <span className='font-medium text-foreground'>
                {(() => {
                  if (typeof nextAvailableTime === 'string') {
                    return nextAvailableTime.includes('T')
                      ? nextAvailableTime.split('T')[1]?.slice(0, 5) || '00:00'
                      : nextAvailableTime.slice(0, 5) || '00:00'
                  }
                  return new Date(nextAvailableTime).toLocaleTimeString(
                    'pt-BR',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Sao_Paulo',
                    }
                  )
                })()}
              </span>
            </div>
            {stats.totalWaitTime > 0 && (
              <span className='text-orange-600 font-medium'>
                {stats.totalWaitTime}min espera
              </span>
            )}
          </div>
          {stats.efficiency < 80 && (
            <div className='mt-1 text-xs text-yellow-600'>
              ⚠️ {stats.efficiency}% pontualidade
            </div>
          )}
        </div>
      )}

      {/* Agendamento Atual */}
      {currentAppointment && (
        <div className='mb-3'>
          <div className='text-xs font-medium text-muted-foreground mb-2'>
            ATENDENDO AGORA
          </div>
          <AppointmentQueueCard
            appointment={currentAppointment}
            status='in-progress'
            queueCalculations={queueCalculations}
          />
        </div>
      )}

      {/* Fila de Agendamentos */}
      {upcomingAppointments.length > 0 && (
        <div>
          <div className='text-xs font-medium text-muted-foreground mb-2'>
            FILA ({upcomingAppointments.length})
          </div>
          <div className='space-y-2'>
            {upcomingAppointments.slice(0, 5).map((appointment, index) => (
              <AppointmentQueueCard
                key={appointment.id}
                appointment={appointment}
                status={index === 0 ? 'next' : 'waiting'}
                queueCalculations={queueCalculations}
              />
            ))}
            {upcomingAppointments.length > 5 && (
              <div className='text-xs text-center text-muted-foreground py-2'>
                +{upcomingAppointments.length - 5} agendamentos
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {totalAppointments === 0 && (
        <div className='text-center py-8'>
          <div className='w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2'>
            <Clock className='w-6 h-6 text-muted-foreground' />
          </div>
          <p className='text-sm text-muted-foreground'>Sem agendamentos</p>
          {isToday && (
            <p className='text-xs text-muted-foreground mt-1'>
              Disponível agora
            </p>
          )}
        </div>
      )}
    </div>
  )
}
