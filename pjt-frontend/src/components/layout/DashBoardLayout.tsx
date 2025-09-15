import { Outlet } from 'react-router-dom'
import { useState } from 'react'

import { Sidebar } from '@/components/layout/Sidebar'
import { useUser } from '@/contexts/UserContext'
import { FirstTimeSetup } from '@/components/custom/FirstTimeSetup'
import { SidebarProvider } from '@/contexts/SidebarContext'

import { Header } from '../custom/Header'

function DashboardContent() {
  const { user, isAdmin } = useUser()
  const [showSetup, setShowSetup] = useState(false)

  const isFirstTime = isAdmin && user && !user.businessName

  if (isFirstTime && !showSetup) {
    setShowSetup(true)
  }

  if (showSetup) {
    return <FirstTimeSetup onComplete={() => setShowSetup(false)} />
  }

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 min-h-screen ml-0 lg:ml-64 bg-gray-50 relative">
        <div className="fixed top-0 left-0 right-0 z-40 lg:ml-64">
          <Header />
        </div>

        <div className="p-3 md:p-6 mt-27">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  )
}
