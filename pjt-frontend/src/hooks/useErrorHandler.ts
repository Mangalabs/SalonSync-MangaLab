import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCallback } from 'react'

export function useErrorHandler() {
  const queryClient = useQueryClient()

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context || 'operation'}:`, error)
    
    const message = error.userMessage || error.response?.data?.message || error.message || 'Erro inesperado'
    
    // Não mostrar toast se já foi mostrado pelo interceptor
    if (!error.config?.headers?.['x-silent-error']) {
      toast.error(message)
    }
  }, [])

  const handleRetry = useCallback((queryKey?: string[]) => {
    if (queryKey) {
      queryClient.invalidateQueries({ queryKey })
    } else {
      queryClient.invalidateQueries()
    }
    toast.success('Tentando novamente...')
  }, [queryClient])

  const handleOfflineError = useCallback(() => {
    toast.error('Você está offline. Algumas funcionalidades podem não estar disponíveis.')
  }, [])

  return {
    handleError,
    handleRetry,
    handleOfflineError,
  }
}

// Hook para queries com retry automático
export function useQueryWithRetry() {
  const { handleError } = useErrorHandler()

  return {
    retry: (failureCount: number, error: any) => {
      // Não fazer retry para erros 4xx (exceto 408, 429)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        if (error.response.status === 408 || error.response.status === 429) {
          return failureCount < 2
        }
        return false
      }
      
      // Fazer retry para erros de rede e 5xx
      return failureCount < 3
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: handleError,
  }
}