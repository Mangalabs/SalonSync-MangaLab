import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import axios from '@/lib/axios'
import CheckoutForm from '@/components/pages/CheckoutForm'

export function SubscriptionManagement() {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await axios.get('/api/payment/user-has-active-subscription')
        setHasActiveSubscription(res.data)
      } catch (error) {
        setHasActiveSubscription(false)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      checkSubscription()
    } else {
      setIsLoading(false)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (hasActiveSubscription) {
    const handleManageSubscription = async () => {
      try {
        const response = await axios.post('/api/payment/create-portal-session')
        if (response.data.url) {
          window.open(response.data.url, '_blank')
        }
      } catch {
        window.open('https://billing.stripe.com/p/login/test_bIY5lq6Ry8Ry8Ry', '_blank')
      }
    }

    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Gerenciar Assinatura
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <h4 className="font-medium text-green-800 mb-2">
              Você já tem uma assinatura conosco
            </h4>
            <p className="text-sm text-green-700 mb-3">
              Você também pode gerenciar sua assinatura.
            </p>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-green-800 mb-1">
                E-mail
              </label>
              <div className="text-sm text-green-700">
                {user?.email || 'Não informado'}
              </div>
            </div>
            
            <button 
              onClick={handleManageSubscription}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Gerenciar assinatura
            </button>
            
            <div className="mt-4 pt-3 border-t border-green-200">
              <div className="flex items-center justify-between text-xs text-green-600">
                <span>Powered by Stripe</span>
                <div className="space-x-2">
                  <a href="#" className="hover:underline">Termos</a>
                  <a href="#" className="hover:underline">Privacidade</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <CheckoutForm />
    </div>
  )
}
