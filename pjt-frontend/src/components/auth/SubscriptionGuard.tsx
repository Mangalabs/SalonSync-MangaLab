import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

import axios from '@/lib/axios'
import { Skeleton } from '@/components/ui/skeleton'

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGuard({
  children,
  fallback,
}: SubscriptionGuardProps) {
  const [userHasAccess, setUserHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchSubscription()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchSubscription = async () => {
    try {
      const res = await axios.get('/api/payment/user-has-active-subscription')
      setUserHasAccess(res.data)
    } catch {
      // TODO: Redirect to subscription page
      // localStorage.removeItem("token");
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!userHasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Assinatura não concluída</h2>
          <p className="text-gray-500 mt-2">
            Você ainda não tem permissão para acessar esta area. Faça a sua
            inscrição nas configurações
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
