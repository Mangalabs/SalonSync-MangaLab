import { useState, useEffect, useCallback } from 'react'

interface UseRealTimeUpdatesProps {
  refetchFunction: () => void
  intervalMs?: number
  isActive?: boolean
}

export function useRealTimeUpdates({ 
  refetchFunction, 
  intervalMs = 30000, // 30 segundos por padrão
  isActive = true, 
}: UseRealTimeUpdatesProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)

  // Função para atualizar manualmente
  const forceUpdate = useCallback(async () => {
    if (isUpdating) {return}
    
    setIsUpdating(true)
    try {
      await refetchFunction()
      setLastUpdate(new Date())
      setUpdateCount(prev => prev + 1)
    } finally {
      setIsUpdating(false)
    }
  }, [refetchFunction, isUpdating])

  // Timer para atualizações automáticas
  useEffect(() => {
    if (!isActive) {return}

    const interval = setInterval(() => {
      forceUpdate()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [forceUpdate, intervalMs, isActive])

  // Atualizar quando a aba volta ao foco
  useEffect(() => {
    if (!isActive) {return}

    const handleFocus = () => {
      // Verificar se passou mais de 1 minuto desde a última atualização
      const timeSinceLastUpdate = Date.now() - lastUpdate.getTime()
      if (timeSinceLastUpdate > 60000) { // 1 minuto
        forceUpdate()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [forceUpdate, lastUpdate, isActive])

  // Formatar tempo desde última atualização
  const getTimeSinceLastUpdate = useCallback(() => {
    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffMinutes > 0) {
      return `${diffMinutes}min atrás`
    }
    
    return `${diffSeconds}s atrás`
  }, [lastUpdate])

  // Status da conexão (simulado)
  const getConnectionStatus = useCallback(() => {
    if (isUpdating) {return 'updating'}
    
    const timeSinceLastUpdate = Date.now() - lastUpdate.getTime()
    if (timeSinceLastUpdate > intervalMs * 2) {return 'stale'}
    if (timeSinceLastUpdate > intervalMs * 1.5) {return 'warning'}
    
    return 'connected'
  }, [lastUpdate, intervalMs, isUpdating])

  return {
    lastUpdate,
    isUpdating,
    updateCount,
    forceUpdate,
    getTimeSinceLastUpdate,
    getConnectionStatus,
  }
}