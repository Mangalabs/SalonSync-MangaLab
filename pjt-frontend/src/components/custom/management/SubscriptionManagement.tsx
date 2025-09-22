import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

import api from '@/lib/axios'

export function SubscriptionManagement() {
  const createSession = async () => {
    const result = await api.post('/api/payment/create-portal-session')

    if (result.data.url) {
      window.open(result.data.url, '_blank')
    }
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      <Button
        size='sm'
        variant='outline'
        onClick={() => createSession()}
        className='w-full text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2]'
      >
        Abrir Pagina de Gerenciamento de Assinatura
      </Button>
    </div>
  )
}
