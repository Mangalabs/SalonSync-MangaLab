import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { PrivateRoute } from '@/lib/PrivateRoute'
import Settings from '@/components/pages/Settings'
import Professionals from '@/components/pages/Professionals'
import Dashboard from '@/components/pages/Dashboard'
import ResetPasswordRequest from '@/components/pages/ResetPasswordRequest'
import ResetPassword from '@/components/pages/ResetPassword'
import Home from '@/components/pages/Home'
import { BranchProvider } from '@/contexts/BranchContext'
import { UserProvider } from '@/contexts/UserContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { SubscriptionGuard } from '@/components/auth/SubscriptionGuard'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary, NetworkIndicator } from '@/components/ui/error-boundary'

import { DashboardLayout } from './components/layout/DashBoardLayout'
import Services from './components/pages/Services'
import Clients from './components/pages/Clients'
import Inventory from './components/pages/Inventory'
import CheckoutPage from './components/pages/CheckoutPage'
import Register from './components/pages/Register'
import Reports from './pages/Reports'
import Financial from './pages/Financial'
import Fidelity from './components/pages/Fidelity'
import TestBranch from './pages/TestBranch'
import NewAppointment from './components/pages/NewAppointments'
import Help from './components/pages/Help'
import Sales from './components/pages/Sales'
import BookingPage from './pages/booking/BookingPage'

export default function App() {
  return (
    <ErrorBoundary>
      <NetworkIndicator />
      <UserProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/request-reset' element={<ResetPasswordRequest />} />
              <Route path='/resetpassword' element={<ResetPassword />} />
              <Route path='/register' element={<Register />} />
              <Route path='/checkout' element={<CheckoutPage />} />

              <Route
                path='/dashboard'
                element={
                  <PrivateRoute>
                    <BranchProvider>
                      <DashboardLayout />
                    </BranchProvider>
                  </PrivateRoute>
                }>
                <Route
                  index
                  element={
                    <SubscriptionGuard>
                      <Dashboard />
                    </SubscriptionGuard>
                  }
                />
                <Route
                  path='professionals'
                  element={
                    <RoleGuard allowedRoles={['ADMIN']}>
                      <SubscriptionGuard>
                        <Professionals />
                      </SubscriptionGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path='services'
                  element={
                    <RoleGuard allowedRoles={['ADMIN', 'PROFESSIONAL']}>
                      <SubscriptionGuard>
                        <Services />
                      </SubscriptionGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path='clients'
                  element={
                    <RoleGuard allowedRoles={['ADMIN', 'PROFESSIONAL']}>
                      <SubscriptionGuard>
                        <Clients />
                      </SubscriptionGuard>
                    </RoleGuard>
                  }
                />

                <Route
                  path='appointments'
                  element={
                    <SubscriptionGuard>
                      <NewAppointment />
                    </SubscriptionGuard>
                  }
                />

                <Route
                  path='sales'
                  element={
                    <RoleGuard allowedRoles={['ADMIN', 'PROFESSIONAL']}>
                      <SubscriptionGuard>
                        <Sales />
                      </SubscriptionGuard>
                    </RoleGuard>
                  }
                />

                <Route
                  path='inventory'
                  element={
                    <RoleGuard allowedRoles={['ADMIN', 'PROFESSIONAL']}>
                      <SubscriptionGuard>
                        <Inventory />
                      </SubscriptionGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path='reports'
                  element={
                    <RoleGuard allowedRoles={['ADMIN']}>
                      <SubscriptionGuard>
                        <Reports />
                      </SubscriptionGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path='financial'
                  element={
                    <RoleGuard allowedRoles={['ADMIN']}>
                      <SubscriptionGuard>
                        <Financial />
                      </SubscriptionGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path='settings'
                  element={
                    <RoleGuard allowedRoles={['ADMIN', 'PROFESSIONAL']}>
                      <Settings />
                    </RoleGuard>
                  }
                />
                <Route
                  path='fidelity'
                  element={
                    <RoleGuard allowedRoles={['ADMIN', 'PROFESSIONAL']}>
                      <Fidelity />
                    </RoleGuard>
                  }
                />
                <Route
                  path='test-branch'
                  element={
                    <RoleGuard allowedRoles={['ADMIN']}>
                      <SubscriptionGuard>
                        <TestBranch />
                      </SubscriptionGuard>
                    </RoleGuard>
                  }
                />
                <Route path='help' element={<Help />} />
              </Route>

              <Route
                path='/booking/:businessSlug/:branchSlug'
                element={<BookingPage />}
              />
              <Route path='*' element={<Home />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </ThemeProvider>
      </UserProvider>
    </ErrorBoundary>
  )
}
