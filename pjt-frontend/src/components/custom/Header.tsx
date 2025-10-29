import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Building,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
} from 'lucide-react'

import { isAuthenticated } from '@/lib/auth'
import { useBranch } from '@/contexts/BranchContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useUser } from '@/contexts/UserContext'

export function Header() {
  const navigate = useNavigate()
  const { activeBranch, branches, setActiveBranch } = useBranch()
  const { toggle } = useSidebar()
  const { user, logout } = useUser()

  const [showBranchDropdown, setShowBranchDropdown] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const branchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setShowBranchDropdown(false)
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotificationDropdown(false)
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown =
    (setter: Function, ...others: Function[]) =>
      (e: React.MouseEvent) => {
        e.stopPropagation()
        setter((prev: boolean) => !prev)
        others.forEach((fn) => fn(false))
      }

  const selectBranch = (branch: typeof activeBranch) => {
    setActiveBranch(branch)
    setShowBranchDropdown(false)
  }

  const handleLogout = () => {
    logout()
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
    <div className='relative' ref={refEl}>
      {button}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 ${className} rounded-xl shadow-lg border z-50 overflow-hidden bg-popover text-popover-foreground border-border`}>
          {children}
        </div>
      )}
    </div>
  )

  return (
    <header className='shadow-lg border-b bg-background border-border/30'>
      <div className='mx-auto px-4 sm:px-6 lg:px-9'>
        <div className='flex justify-between items-center h-23'>
          <div className='flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0'>
            <button
              onClick={toggle}
              className='flex-shrink-0 p-2 text-muted-foreground hover:text-foreground hover:bg-hover rounded-lg transition-colors duration-200 lg:hidden'>
              <Menu className='w-6 h-6' />
            </button>

            <div className='flex-shrink-0 min-w-0'>
              <div className='text-xl sm:text-2xl font-bold truncate text-foreground'>
                {activeBranch?.name || 'SalonSync'}
              </div>
              <div className='text-sm sm:text-base hidden sm:block truncate text-muted-foreground'>
                {activeBranch?.address || 'Sistema de Gestão'}
              </div>
            </div>
          </div>

          {isAuthenticated() && (
            <div className='flex items-center space-x-1 sm:space-x-3 flex-shrink-0'>
              <Dropdown
                isOpen={showBranchDropdown}
                refEl={branchRef}
                button={
                  <button
                    onClick={toggleDropdown(
                      setShowBranchDropdown,
                      setShowNotificationDropdown,
                      setShowProfileDropdown,
                    )}
                    className='flex items-center space-x-2 px-3 sm:px-4 p-3 rounded-xl transition-all duration-200 bg-muted text-foreground  cursor-pointer'>
                    <Building className='w-5 h-5 text-secondary-foreground' />
                    <span className='hidden sm:inline font-medium'>
                      {activeBranch?.name}
                    </span>
                    <ChevronDown className='w-4 h-4 text-secondary-foreground' />
                  </button>
                }
                className='w-40 sm:w-64 md:w-72'>
                <div className='px-3 py-2 border-b border-border'>
                  <h3 className='text-sm sm:text-base font-semibold flex items-center text-foreground'>
                    <Building className='w-4 sm:w-5 h-4 sm:h-5 mr-2 text-secondary-foreground' />
                    <span>Selecionar Filial</span>
                  </h3>
                </div>
                <div className='max-h-56 sm:max-h-64 overflow-y-auto'>
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => selectBranch(branch)}
                      className='w-full text-left px-3 sm:px-4 py-2 sm:py-3 transition-all hover:bg-gray-400/15 duration-150 flex items-center space-x-2 sm:space-x-3 bg-popover text-popover-foreground  cursor-pointer'>
                      <Building className='w-5 sm:w-6 h-5 sm:h-6 text-secondary-foreground' />
                      <div className='flex-1 min-w-0'>
                        <div className='text-sm font-medium truncate text-foreground'>
                          {branch.name}
                        </div>
                        <div className='text-xs sm:text-sm truncate text-muted-foreground'>
                          {branch.address}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Dropdown>

              <Dropdown
                isOpen={showProfileDropdown}
                refEl={profileRef}
                button={
                  <button
                    onClick={toggleDropdown(
                      setShowProfileDropdown,
                      setShowBranchDropdown,
                      setShowNotificationDropdown,
                    )}
                    className='flex items-center space-x-2 sm:space-x-3 p-1 rounded-xl transition-colors duration-200 bg-muted text-foreground cursor-pointer'>
                    <div className='w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg bg-secondary'>
                      <span className='text-secondary-foreground font-semibold'>
                        {user?.name?.[0] || 'U'}
                      </span>
                    </div>
                    <div className='text-left hidden lg:block'>
                      <div className='text-foreground font-medium'>
                        {user?.name || 'Usuário'}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        {user?.email || 'sem-email@exemplo.com'}
                      </div>
                    </div>
                    <ChevronDown className='w-4 h-4 hidden sm:block text-muted-foreground' />
                  </button>
                }
                className='w-56'>
                <div className='p-4 border-b flex items-center space-x-3 bg-popover border-border'>
                  <div className='w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-secondary'>
                    <span className='text-secondary-foreground font-semibold text-lg'>
                      {user?.name?.[0] || 'U'}
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-foreground font-medium'>
                      {user?.name || 'Usuário'}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      {user?.email || 'sem-email@exemplo.com'}
                    </div>
                  </div>
                </div>
                <div className='py-2'>
                  {[
                    {
                      label: 'Configurações',
                      icon: Settings,
                      action: () => navigate('/dashboard/settings'),
                    },
                    {
                      label: 'Ajuda',
                      icon: HelpCircle,
                      action: () => navigate('/dashboard/help'),
                    },
                  ].map(({ label, icon: Icon, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className='flex items-center px-4 py-3 w-full transition-colors duration-150 bg-popover text-foreground hover:bg-gray-400/15 cursor-pointer'>
                      <Icon className='w-5 h-5 mr-3 text-muted-foreground' />
                      {label}
                    </button>
                  ))}
                  <hr className='my-1 border-t border-border' />
                  <button
                    onClick={handleLogout}
                    className='flex items-center px-4 py-3 w-full transition-colors duration-150 bg-popover text-destructive hover:bg-hover cursor-pointer'>
                    <LogOut className='w-5 h-5 mr-3 text-destructive' />
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
