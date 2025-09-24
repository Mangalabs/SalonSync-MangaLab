import React from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from './button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const isNetworkError = error.message.includes('Network Error') || 
                         error.message.includes('fetch') ||
                         !navigator.onLine

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          {isNetworkError ? (
            <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          ) : (
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          )}
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isNetworkError ? 'Sem Conexão' : 'Algo deu errado'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {isNetworkError 
              ? 'Verifique sua conexão com a internet e tente novamente.'
              : 'Ocorreu um erro inesperado. Nossa equipe foi notificada.'
            }
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={retry}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Recarregar Página
          </Button>
        </div>

        {!isNetworkError && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 text-xs text-gray-400 bg-gray-50 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Hook para detectar status da conexão
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Componente de indicador de conexão
export function NetworkIndicator() {
  const isOnline = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm font-medium z-50">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        Sem conexão com a internet
      </div>
    </div>
  )
}