import React from 'react'

import { useBranchServices } from '@/hooks/usePublicBooking'

interface ServiceSelectorProps {
  branchId: string
  onSelect: (services: any[]) => void
  selectedServices?: any[]
}

export function ServiceSelector({ branchId, onSelect, selectedServices = [] }: ServiceSelectorProps) {
  const { data: services, isLoading, error } = useBranchServices(branchId)
  const [selected, setSelected] = React.useState<any[]>(selectedServices)
  


  const toggleService = (service: any) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) {
        return prev.filter(s => s.id !== service.id)
      } else {
        return [...prev, service]
      }
    })
  }

  const getTotalPrice = () => {
    return selected.reduce((total, service) => total + parseFloat(service.price), 0)
  }

  if (isLoading) {
    return <div className="text-center py-8">Carregando serviços...</div>
  }
  
  if (error) {
    return (
      <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-200">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-800 mb-2 font-medium">Erro ao carregar serviços</p>
        <p className="text-sm text-red-600">{error?.message || 'Tente recarregar a página'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Escolha os serviços</h2>
        <p className="text-muted-foreground">Selecione um ou mais serviços desejados</p>
        {selected.length > 0 && (
          <div className="mt-2 text-sm text-primary font-medium">
            {selected.length} serviço{selected.length > 1 ? 's' : ''} selecionado{selected.length > 1 ? 's' : ''} - Total: R$ {getTotalPrice().toFixed(2)}
          </div>
        )}
      </div>
      
      {services?.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-2xl border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-foreground mb-2 font-medium">Nenhum serviço disponível</p>
          <p className="text-sm text-muted-foreground">Entre em contato com o estabelecimento</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {services?.map((service: any) => {
              const isSelected = selected.find(s => s.id === service.id)
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`group p-6 border-2 rounded-2xl hover:shadow-lg text-left transition-all duration-200 ${
                    isSelected 
                      ? 'bg-primary/5 border-primary shadow-md' 
                      : 'bg-card border-border hover:border-primary hover:scale-105'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold text-lg transition-colors ${
                      isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                    }`}>{service.name}</h3>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                    }`}>
                      {isSelected ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mb-1">R$ {service.price}</p>
                  <p className="text-sm text-muted-foreground">
                    {isSelected ? 'Selecionado' : 'Clique para selecionar'}
                  </p>
                </button>
              )
            })}
          </div>
          
          {selected.length > 0 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => onSelect(selected)}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Continuar com {selected.length} serviço{selected.length > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}