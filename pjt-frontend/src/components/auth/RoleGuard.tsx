import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useUser } from '@/contexts/UserContext'
import { Skeleton } from '@/components/ui/skeleton'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  fallback?: ReactNode
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback,
}: RoleGuardProps) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='space-y-4 text-center'>
          <Skeleton className='h-12 w-12 rounded-full mx-auto' />
          <Skeleton className='h-4 w-32 mx-auto' />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  if (!allowedRoles.includes(user.role) && user.role !== 'SUPERADMIN') {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-700'>Acesso Negado</h2>
          <p className='text-gray-500 mt-2'>
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
