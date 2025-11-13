import { Check, Crown } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function PlanCard({ product, selectedPlan, setSelectedPlan }) {
  const unitAmount = product.default_price.unit_amount_decimal
  const formattedUnitAmount =
    unitAmount.slice(0, -2) + ',' + unitAmount.slice(-2)

  const isCurrent = selectedPlan?.id === product.id

  return (
    <div className='bg-card rounded-2xl p-6 shadow-sm border w-full border-border'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h4 className='text-xl font-bold text-foreground'>{product.name}</h4>
          <p className='text-muted-foreground text-sm'>{product.description}</p>
        </div>
        <div className='text-right'>
          <p className='text-2xl font-bold text-foreground'>{`R$ ${formattedUnitAmount}/mês`}</p>
          <span className='text-sm text-muted-foreground'>
            Pagamento recorrente
          </span>
        </div>
      </div>

      <div className='mb-4'>
        <h5 className='font-semibold text-foreground mb-2'>
          Recursos inclusos:
        </h5>
        <div className='space-y-1'>
          {product.marketing_features.map((feature, idx) => (
            <div
              key={idx}
              className='flex items-center gap-2 text-sm text-foreground'>
              <Check className='w-4 h-4 text-primary' />
              <span>{feature.name}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        className='w-full py-2 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-secondary transition-colors cursor-pointer'
        onClick={() => setSelectedPlan(product)}>
        Escolher plano
      </Button>

      {isCurrent && (
        <div className='mt-3 p-3 bg-muted border border-border rounded-xl text-sm text-primary flex items-center gap-2'>
          <Crown className='w-5 h-5 text-primary' />
          Plano atual
        </div>
      )}
    </div>
  )
}
