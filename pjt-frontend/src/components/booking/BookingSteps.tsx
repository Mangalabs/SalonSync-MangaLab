import React from 'react'
import { Check } from 'lucide-react'

interface BookingStepsProps {
  currentStep: number
  onStepClick: (step: number) => void
  completedSteps: number[]
}

const steps = [
  { id: 1, name: 'Serviço', description: 'Escolha o serviço' },
  { id: 2, name: 'Profissional', description: 'Selecione o profissional' },
  { id: 3, name: 'Data/Hora', description: 'Escolha data e horário' },
  { id: 4, name: 'Dados', description: 'Informe seus dados' },
  { id: 5, name: 'Confirmação', description: 'Confirme o agendamento' },
]

export function BookingSteps({ currentStep, onStepClick, completedSteps }: BookingStepsProps) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isClickable = isCompleted || step.id <= currentStep
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                      : step.id === currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-muted border-border text-muted-foreground'
                  } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    isCompleted || step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-4 transition-colors ${
                    isCompleted ? 'bg-green-600' : 'bg-border'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}