import { Loader2, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from './button'

interface LoadingStateProps {
  isLoading?: boolean
  error?: any
  onRetry?: () => void
  loadingText?: string
  emptyText?: string
  children?: React.ReactNode
}

export function LoadingState({ 
  isLoading, 
  error, 
  onRetry, 
  loadingText = 'Carregando...', 
  emptyText = 'Nenhum dado encontrado',
  children 
}: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">{loadingText}</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isNetworkError = !navigator.onLine || 
                          error.message?.includes('Network Error') ||
                          error.code === 'NETWORK_ERROR'

    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          {isNetworkError ? (
            <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          ) : (
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          )}
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isNetworkError ? 'Sem Conexão' : 'Erro ao Carregar'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {error.userMessage || error.message || 'Algo deu errado ao carregar os dados'}
          </p>
          
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Componente específico para listas vazias
export function EmptyState({ 
  icon: Icon = AlertTriangle,
  title = 'Nenhum item encontrado',
  description = 'Não há dados para exibir no momento.',
  action
}: {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md">
        <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {action}
      </div>
    </div>
  )
}