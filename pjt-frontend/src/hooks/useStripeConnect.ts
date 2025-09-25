import { useState, useEffect } from 'react'
import { loadConnectAndInitialize } from '@stripe/connect-js'

import axios from '@/lib/axios'

export const useStripeConnect = (connectedAccountId) => {
  const [stripeConnectInstance, setStripeConnectInstance] = <any>useState()

  useEffect(() => {
    if (connectedAccountId) {
      const fetchClientSecret = async () => {
        const response = await axios.post('/api/payment/account_session', {
          account: connectedAccountId,
        })

        const { client_secret: clientSecret } = await response.data
        return clientSecret
      }

      setStripeConnectInstance(
        loadConnectAndInitialize({
          publishableKey: import.meta.env.VITE_STRIPE_API_KEY || '',
          fetchClientSecret,
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: '#635BFF',
            },
          },
        }),
      )
    }
  }, [connectedAccountId])

  return stripeConnectInstance
}

export default useStripeConnect
