import React from 'react'
import { useBranchServices } from '@/hooks/usePublicBooking'

interface ServiceSelectorProps {
  branchId: string
  onSelect: (service: any) => void
}

export function ServiceSelector({ branchId, onSelect }: ServiceSelectorProps) {
  const { data: services, isLoading } = useBranchServices(branchId)

  if (isLoading) return <div className="text-center py-8">Carregando serviços...</div>

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Escolha um serviço</h2>
        <p className="text-muted-foreground">Selecione o serviço desejado para continuar</p>
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
        <div className="grid gap-4 md:grid-cols-2">
          {services?.map((service: any) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="group p-6 bg-card border-2 border-border rounded-2xl hover:border-primary hover:shadow-lg text-left transition-all duration-200 hover:scale-105"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{service.name}</h3>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">R$ {service.price}</p>
              <p className="text-sm text-muted-foreground">Clique para selecionar</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}