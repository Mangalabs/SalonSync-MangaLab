import React, { useState } from 'react'

import { useProfessionalAvailability } from '@/hooks/usePublicBooking'

interface DateTimeSelectorProps {
  professionalId: string
  onSelect: (dateTime: { date: string; time: string; datetime: string }) => void
  onBack: () => void
}

export function DateTimeSelector({
  professionalId,
  onSelect,
  onBack,
}: DateTimeSelectorProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  // Generate next 7 days (excluding Sundays)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })
    .filter((date) => date.getDay() !== 0)
    .slice(0, 7) // Remove Sundays, take first 7

  const { data: availability } = useProfessionalAvailability(
    professionalId,
    selectedDate,
  )

  const availableTimes = availability?.availableTimes || []

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      const datetime = `${selectedDate}T${selectedTime}:00`
      onSelect({
        date: new Date(selectedDate).toLocaleDateString('pt-BR'),
        time: selectedTime,
        datetime,
      })
    }
  }

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-gray-800 mb-2'>
          Escolha data e horário
        </h2>
        <p className='text-gray-600'>Selecione o melhor horário para você</p>
      </div>

      {/* Date Selection */}
      <div>
        <h3 className='text-lg font-semibold text-gray-700 mb-4'>Data</h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {dates.map((date) => {
            const dateStr = date.toISOString().split('T')[0]
            const isSelected = selectedDate === dateStr
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}>
                <div className='text-sm text-gray-500'>
                  {isToday
                    ? 'Hoje'
                    : date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </div>
                <div className='font-semibold'>
                  {date.getDate()}/{date.getMonth() + 1}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div>
          <h3 className='text-lg font-semibold text-gray-700 mb-4'>Horário</h3>
          <div className='grid grid-cols-3 md:grid-cols-6 gap-3'>
            {availableTimes.length === 0 ? (
              <div className='col-span-full text-center py-8 text-muted-foreground'>
                {selectedDate
                  ? 'Nenhum horário disponível para esta data'
                  : 'Selecione uma data primeiro'}
              </div>
            ) : (
              availableTimes.map((time: string) => {
                const isSelected = selectedTime === time

                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary hover:bg-primary/10'
                    }`}>
                    {time}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex gap-4 pt-4'>
        <button
          onClick={onBack}
          className='px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors'>
          Voltar
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
          Continuar
        </button>
      </div>
    </div>
  )
}
