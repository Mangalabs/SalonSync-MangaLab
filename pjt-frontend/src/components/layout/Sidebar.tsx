import {
  Home,
  Users,
  User,
  Package,
  TrendingUp,
  FileText,
  MessageCircle,
  Settings,
  Calendar,
  PlusCircle,
  Scissors,
  ShoppingCart,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProductSaleForm } from '@/components/custom/products/ProductSaleForm'
import { useUser } from '@/contexts/UserContext'
import { useSidebar } from '@/contexts/SidebarContext'

const menuSections = [
  {
    title: 'Principal',
    items: [{ to: '/dashboard', icon: Home, label: 'Dashboard', roles: ['ADMIN', 'PROFESSIONAL'] }],
  },
  {
    title: 'Atendimento',
    items: [
      { to: '/dashboard/appointments', icon: Calendar, label: 'Atendimento', roles: ['ADMIN', 'PROFESSIONAL'] },
      { to: '/dashboard/clients', icon: Users, label: 'Clientes', roles: ['ADMIN', 'PROFESSIONAL'] },
    ],
  },
  {
    title: 'Negócio',
    items: [
      { to: '/dashboard/services', icon: Scissors, label: 'Serviços', roles: ['ADMIN', 'PROFESSIONAL'] },
      { to: '/dashboard/sales', icon: ShoppingCart, label: 'Vendas', roles: ['ADMIN', 'PROFESSIONAL']},
      { to: '/dashboard/inventory', icon: Package, label: 'Estoque', roles: ['ADMIN', 'PROFESSIONAL'] },
      { to: '/dashboard/professionals', icon: User, label: 'Profissionais', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { to: '/dashboard/financial', icon: TrendingUp, label: 'Financeiro', roles: ['ADMIN'] },
      { to: '/dashboard/reports', icon: FileText, label: 'Relatórios', roles: ['ADMIN'] },
      { to: '/dashboard/whatsapp', icon: MessageCircle, label: 'WhatsApp', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Sistema',
    items: [{ to: '/dashboard/settings', icon: Settings, label: 'Configurações', roles: ['ADMIN', 'PROFESSIONAL'] }],
  },
]

const getNavItems = (userRole: string) =>
  menuSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => (userRole === 'SUPERADMIN' ? true : item.roles.includes(userRole))),
  }))

const SidebarHeader = ({ onClose }: { onClose?: () => void }) => (
  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
        <Scissors className="text-white w-5 h-5" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-800">SalonSync</h1>
        <p className="text-xs text-gray-500">Sistema de Gestão</p>
      </div>
    </div>
    {onClose && (
      <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:bg-gray-100 p-1">
        <X size={20} />
      </Button>
    )}
  </div>
)

const NavItem = ({ item, onClick }: { item: any; onClick: () => void }) => {
  const { to, icon: Icon, label, opensSaleForm } = item
  const baseClass =
    'w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 hover:translate-x-1 hover:shadow-lg'
  return opensSaleForm ? (
    <button key={label} onClick={onClick} className={`${baseClass} text-gray-600`}>
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  ) : (
    <NavLink
      key={to}
      to={to}
      end={to === '/dashboard'}
      onClick={onClick}
      className={({ isActive }) =>
        `${baseClass} ${isActive ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' : 'text-gray-600'}`
      }
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const [showSaleForm, setShowSaleForm] = useState(false)
  const { user } = useUser()
  const { isOpen, close } = useSidebar()
  const navSections = getNavItems(user?.role || 'ADMIN')

  const handleNavClick = (item?: any) => {
    if (item?.opensSaleForm) {setShowSaleForm(true)}
    else {close()}
  }

  const SidebarContent = () => (
    <>
      <SidebarHeader onClose={isOpen ? close : undefined} />
      <nav className="p-4 flex-1 overflow-y-auto overscroll-contain space-y-3">
        {navSections.map(
          (section, idx) =>
            section.items.length > 0 && (
              <div key={idx} className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-4">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavItem key={item.label} item={item} onClick={() => handleNavClick(item)} />
                  ))}
                </div>
              </div>
            ),
        )}
      </nav>
    </>
  )

  return (
    <>
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={close} />
        <aside
          className={`absolute left-0 top-0 w-64 h-full bg-white text-gray-700 flex flex-col shadow-xl border-r border-gray-200 transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent />
        </aside>
      </div>

      <aside className="hidden lg:flex w-64 h-screen bg-white text-gray-700 flex-col fixed left-0 top-0 shadow-xl border-r border-gray-200">
        <SidebarContent />
      </aside>

      <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Venda de Produto</DialogTitle>
          </DialogHeader>
          <ProductSaleForm onSuccess={() => setShowSaleForm(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
