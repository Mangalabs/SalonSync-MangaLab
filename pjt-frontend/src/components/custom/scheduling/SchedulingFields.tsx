import { Controller } from 'react-hook-form'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SchedulingFieldsProps {
  control: any;
  errors: any;
  availableSlots: string[];
  selectedProfessional: string;
  selectedDate: string;
}

export function SchedulingFields({ 
  control, 
  errors, 
  availableSlots, 
  selectedProfessional, 
  selectedDate, 
}: SchedulingFieldsProps) {
  return (
    <div className="space-y-3">
      {selectedProfessional && selectedDate && availableSlots.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="text-lg">🚫</span>
            <div>
              <p className="font-medium text-sm">Todos os horários estão ocupados</p>
              <p className="text-xs text-amber-700">Escolha outra data ou profissional para ver horários disponíveis</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label htmlFor="scheduledDate" className="text-sm">Data</Label>
        <Controller
          name="scheduledDate"
          control={control}
          render={({ field }) => (
            <Input
              id="scheduledDate"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="h-8 text-sm"
              {...field}
            />
          )}
        />
        {errors.scheduledDate && (
          <p className="text-xs text-red-500">{errors.scheduledDate.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="scheduledTime" className="text-sm">Horário</Label>
        <Controller
          name="scheduledTime"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.length > 0 ? (
                  availableSlots.map((time: string) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-xs">
                    {selectedProfessional && selectedDate ? (
                      <span className="text-amber-600 font-medium">
                        🚫 Todos os horários estão ocupados
                      </span>
                    ) : (
                      <span className="text-[#737373]">
                        Selecione profissional e data
                      </span>
                    )}
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.scheduledTime && (
          <p className="text-xs text-red-500">{errors.scheduledTime.message}</p>
        )}
      </div>
      </div>
    </div>
  )
}