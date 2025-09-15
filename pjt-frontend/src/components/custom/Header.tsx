import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  Building,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
} from 'lucide-react'

import { isAuthenticated, logout } from '@/lib/auth'
import { useBranch } from '@/contexts/BranchContext'
import { useSidebar } from '@/contexts/SidebarContext'

export function Header() {
  const navigate = useNavigate()
  const { activeBranch, branches, setActiveBranch } = useBranch()
  const { toggle } = useSidebar()

  const [showBranchDropdown, setShowBranchDropdown] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const branchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {setShowBranchDropdown(false)}
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {setShowNotificationDropdown(false)}
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {setShowProfileDropdown(false)}
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const toggleDropdown = (setter: Function, ...others: Function[]) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setter((prev: boolean) => !prev)
    others.forEach(fn => fn(false))
  }

  const selectBranch = (branch: typeof activeBranch) => {
    setActiveBranch(branch)
    setShowBranchDropdown(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const Dropdown = ({
    isOpen,
    button,
    children,
    refEl,
    className = '',
  }: {
    isOpen: boolean
    button: React.ReactNode
    children: React.ReactNode
    refEl: React.RefObject<HTMLDivElement>
    className?: string
  }) => (
    <div className="relative" ref={refEl}>
      {button}
      {isOpen && (
        <div className={`absolute right-0 mt-2 ${className} bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden`}>
          {children}
        </div>
      )}
    </div>
  )

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-27">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <button onClick={toggle} className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-shrink-0 min-w-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{activeBranch?.name || 'SalonSync'}</div>
              <div className="text-sm sm:text-base text-gray-500 hidden sm:block">{activeBranch?.address || 'Sistema de Gestão'}</div>
            </div>
          </div>

          {isAuthenticated() && (
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              <Dropdown
                isOpen={showBranchDropdown}
                refEl={branchRef}
                button={
                  <button
                    onClick={toggleDropdown(setShowBranchDropdown, setShowNotificationDropdown, setShowProfileDropdown)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base text-blue-700 hover:from-blue-100 hover:to-purple-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                  >
                    <Building className="w-5 h-5 text-blue-600" />
                    <span className="hidden sm:inline font-medium">{activeBranch?.name}</span>

                    <ChevronDown className="w-4 h-4 text-blue-500" />
                  </button>
                }
                className="w-40 sm:w-64 md:w-72"
              >
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center">
                    <Building className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-blue-600" />
                    <span className="sm:inline">Selecionar Filial</span>
                  </h3>
                </div>
                <div className="max-h-56 sm:max-h-64 overflow-y-auto">
                  {branches.map(branch => (
                    <button
                      key={branch.id}
                      onClick={() => selectBranch(branch)}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-150 flex items-center space-x-2 sm:space-x-3 group"
                    >
                      <Building className="w-5 sm:w-6 h-5 sm:h-6 text-blue-500 group-hover:scale-110 transition-transform duration-150" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{branch.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">{branch.address}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Dropdown>

              <Dropdown
                isOpen={showNotificationDropdown}
                refEl={notificationRef}
                button={<button
                  onClick={toggleDropdown(setShowNotificationDropdown, setShowBranchDropdown, setShowProfileDropdown)}
                  className="relative p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <Bell className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg">3</span>
                </button>} children={''}/>

              <Dropdown
                isOpen={showProfileDropdown}
                refEl={profileRef}
                button={
                  <button
                    onClick={toggleDropdown(setShowProfileDropdown, setShowBranchDropdown, setShowNotificationDropdown)}
                    className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-base font-semibold">A</span>
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-base font-medium text-gray-800">Admin</div>
                      <div className="text-sm text-gray-500">Proprietário</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </button>
                }
                className="w-56"
              >
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-lg">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-gray-800 truncate">Admin</div>
                    <div className="text-sm text-gray-500">Proprietário</div>
                  </div>
                </div>
                <div className="py-2">
                  {[
                    { label: 'Meu Perfil', icon: User, action: () => navigate('/dashboard/profile') },
                    { label: 'Configurações', icon: Settings, action: () => navigate('/dashboard/settings') },
                    { label: 'Ajuda', icon: HelpCircle, action: () => navigate('/dashboard/help') },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label} onClick={action} className="flex items-center px-4 py-3 text-base text-gray-700 hover:bg-gray-50 w-full transition-colors duration-150">
                      <Icon className="w-5 h-5 mr-3 text-gray-500" />
                      {label}
                    </button>
                  ))}
                  <hr className="my-1" />
                  <button onClick={handleLogout} className="flex items-center px-4 py-3 text-base text-red-600 hover:bg-red-50 w-full transition-colors duration-150">
                    <LogOut className="w-5 h-5 mr-3 text-red-500" />
                    Sair
                  </button>
                </div>
              </Dropdown>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
