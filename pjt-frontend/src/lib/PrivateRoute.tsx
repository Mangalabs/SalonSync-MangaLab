import { Navigate } from 'react-router-dom'
import type { JSX } from 'react'

import { isAuthenticated } from '@/lib/auth'

interface Props {
  children: JSX.Element;
}

export function PrivateRoute({ children }: Props) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}
