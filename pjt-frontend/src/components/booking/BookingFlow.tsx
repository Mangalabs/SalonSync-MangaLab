import React, { useState } from 'react'
import { ServiceSelector } from './ServiceSelector'
import { ProfessionalSelector } from './ProfessionalSelector'
import { DateTimeSelector } from './DateTimeSelector'
import { ClientForm } from './ClientForm'
import { BookingConfirmation } from './BookingConfirmation'
import { BookingSteps } from './BookingSteps'

interface BookingFlowProps {
  branchId: string
  businessName: string
  branchName: string
}

export function BookingFlow({ branchId, businessName, branchName }: BookingFlowProps) {
  const [step, setStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)

  const nextStep = () => {
    setCompletedSteps(prev => [...prev.filter(s => s !== step), step])
    setStep(step + 1)
  }
  const prevStep = () => setStep(step - 1)
  const goToStep = (targetStep: number) => setStep(targetStep)

  return (
    <div className="space-y-6">
      <BookingSteps 
        currentStep={step} 
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />
      
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        {step === 1 && (
          <ServiceSelector
            branchId={branchId}
            onSelect={(service) => {
              setSelectedService(service)
              nextStep()
            }}
          />
        )}
        
        {step === 2 && (
          <ProfessionalSelector
            branchId={branchId}
            onSelect={(professional) => {
              setSelectedProfessional(professional)
              nextStep()
            }}
            onBack={prevStep}
          />
        )}
        
        {step === 3 && selectedProfessional && (
          <DateTimeSelector
            professionalId={selectedProfessional.id}
            onSelect={(dateTime) => {
              setSelectedDateTime(dateTime)
              nextStep()
            }}
            onBack={prevStep}
          />
        )}
        
        {step === 4 && (
          <ClientForm
            onSubmit={(client) => {
              setClientData(client)
              nextStep()
            }}
            onBack={prevStep}
          />
        )}
        
        {step === 5 && (
          <BookingConfirmation
            service={selectedService}
            professional={selectedProfessional}
            dateTime={selectedDateTime}
            client={clientData}
            branchId={branchId}
            businessName={businessName}
            branchName={branchName}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  )
}