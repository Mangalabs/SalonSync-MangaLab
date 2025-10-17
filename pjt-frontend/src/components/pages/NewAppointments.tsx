import React, { useState } from 'react'
import { Calendar as CalendarIcon, Clock, Info } from 'lucide-react'

import AppointmentHistory from '@/components/custom/appointment/AppointmentHistory'

import Appointments from './Appointments'

export default function NewAppointment() {
  const [mode, setMode] = useState<'schedule' | 'register'>('schedule')

  return (
    <div className='space-y-6 mt-4'>
      <div
        className='rounded-2xl p-6 shadow-sm border'
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 2px 6px var(--color-shadow)',
        }}>
        <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
          <div>
            <h2
              className='text-2xl font-bold'
              style={{ color: 'var(--color-foreground)' }}>
              Atendimentos
            </h2>
            <p
              className='mt-1'
              style={{ color: 'var(--color-muted-foreground)' }}>
              Agende novos horários ou visualize dados de atendimentos
            </p>
          </div>

          <div
            className='flex items-center gap-2 p-1 rounded-xl'
            style={{ backgroundColor: 'var(--color-muted)' }}>
            <button
              onClick={() => setMode('schedule')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                mode !== 'schedule' ? 'cursor-pointer' : ''
              }`}
              style={{
                backgroundColor:
                  mode === 'schedule' ? 'var(--color-card)' : 'transparent',
                color:
                  mode === 'schedule'
                    ? 'var(--color-primary)'
                    : 'var(--color-muted-foreground)',
                boxShadow:
                  mode === 'schedule'
                    ? '0 2px 4px var(--color-shadow)'
                    : 'none',
              }}>
              <CalendarIcon className='w-4 h-4' />
              Atendimento
            </button>
            <button
              onClick={() => setMode('register')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                mode !== 'register' ? 'cursor-pointer' : ''
              }`}
              style={{
                backgroundColor:
                  mode === 'register' ? 'var(--color-card)' : 'transparent',
                color:
                  mode === 'register'
                    ? 'var(--color-primary)'
                    : 'var(--color-muted-foreground)',
                boxShadow:
                  mode === 'register'
                    ? '0 2px 4px var(--color-shadow)'
                    : 'none',
              }}>
              <Clock className='w-4 h-4' />
              Histórico
            </button>
          </div>
        </div>

        <div
          className='mt-4 p-3 border rounded-xl flex items-start gap-3'
          style={{
            backgroundColor: 'var(--color-muted)',
            borderColor: 'var(--color-border)',
          }}>
          <Info
            className='w-5 h-5 mt-0.5'
            style={{ color: 'var(--color-primary)' }}
          />
          <div className='text-sm' style={{ color: 'var(--color-foreground)' }}>
            <strong>
              Modo {mode === 'schedule' ? 'Atendimento' : 'Histórico'}:
            </strong>{' '}
            {mode === 'schedule'
              ? 'Visualize e gerencie a agenda, e crie novos agendamentos ou atendimentos imediatos.'
              : 'Visualize histórico e estatísticas dos atendimentos.'}
          </div>
        </div>
      </div>

      {mode === 'schedule' ? <Appointments /> : <AppointmentHistory />}
    </div>
  )
}
