import { useState, useEffect } from 'react'
import {
  ConnectAccountOnboarding,
  ConnectAccountManagement,
  ConnectComponentsProvider,
  ConnectPayments,
} from '@stripe/react-connect-js'

import { useStripeConnect } from '@/hooks/useStripeConnect'
import { useUser } from '@/contexts/UserContext'
import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ClientForm } from '@/components/custom/client/ClientForm'

export default function Fidelity() {
  const { user, update: updateUser } = useUser()
  const [open, setOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any | null>(null)
  const [accountCreatePending, setAccountCreatePending] = useState(false)
  const [onboardingExited, setOnboardingExited] = useState(false)
  const [error, setError] = useState(false)
  const [connectedAccountId, setConnectedAccountId] = useState('')
  const stripeConnectInstance = useStripeConnect(connectedAccountId)

  useEffect(() => {
    if (!user.accountId) {
      createAccount()
    } else {
      setConnectedAccountId(user.accountId)
    }
  }, [user.accountId])

  const createAccount = async () => {
    setAccountCreatePending(true)
    setError(false)

    try {
      const response = await axios.post('/api/payment/account')
      updateUser({ accountId: response.data.id })
      setConnectedAccountId(response.data.id)
    } catch {
      setError(true)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-[#1A1A1A]'>Fidelidade</h1>
      </div>
      {stripeConnectInstance && connectedAccountId && (
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          {/* <ConnectAccountOnboarding onExit={() => setOnboardingExited(true)} /> */}
          <ConnectPayments />
        </ConnectComponentsProvider>
      )}
    </div>
  )
}
