import { useState, useEffect } from 'react'
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
  ConnectPayments,
  ConnectAccountManagement,
  ConnectPayouts,
} from '@stripe/react-connect-js'
import {
  TrendingDown,
  FileStack,
  BanknoteArrowDown,
  Calendar,
  BookUser,
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RecurringExpenseForm } from '@/components/custom/recurring/RecurringExpenseForm'
import { RecurringExpensesTabContent } from '@/components/custom/recurring/RecurringExpensesTabContent'
import { FinancialSummary } from '@/components/custom/financial/FinancialSummary'
import { FinancialTabContent } from '@/components/custom/financial/FinancialTabContent'
import { useStripeConnect } from '@/hooks/useStripeConnect'
import { useUser } from '@/contexts/UserContext'
import axios from '@/lib/axios'

export default function Fidelity() {
  const { update: updateUser } = useUser()
  const [activeTab, setActiveTab] = useState('summary')
  const [connectedAccountId, setConnectedAccountId] = useState('')
  const [connectedAccount, setConnectedAccount] = useState({
    details_submitted: false,
  })
  const stripeConnectInstance = useStripeConnect(connectedAccountId)

  useEffect(() => {
    const createAccount = async () => {
      const response = await axios.post('/api/payment/account')
      updateUser({ accountId: response.data.id })
      setConnectedAccountId(response.data.id)
      setConnectedAccount(response.data)
    }

    createAccount()
  }, [updateUser])

  const tabs = [
    { id: 'summary', label: 'Resumo', icon: BanknoteArrowDown },
    { id: 'income', label: 'Receitas', icon: BookUser },
    { id: 'config', label: 'Configurações', icon: FileStack },
  ]

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-[#1A1A1A]'>Fidelidade</h1>
      </div>
      {stripeConnectInstance && connectedAccountId && (
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          {!connectedAccount.details_submitted && (
            <ConnectAccountOnboarding onExit={() => {}} />
          )}

          {connectedAccount.details_submitted && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='hidden bg-white w-full grid-cols-5 rounded-2xl p-2 shadow-sm border h-15 border-gray-100 flex flex-wrap gap-1'>
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <IconComponent className='w-4 h-4' />
                      {tab.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent value='summary' className='space-y-4 md:space-y-6'>
                <ConnectPayouts />
              </TabsContent>

              <TabsContent value='income' className='space-y-4 md:space-y-6'>
                <ConnectPayments />
              </TabsContent>

              <TabsContent value='config' className='space-y-4 md:space-y-6'>
                <ConnectAccountManagement />
              </TabsContent>
            </Tabs>
          )}
        </ConnectComponentsProvider>
      )}
    </div>
  )
}
