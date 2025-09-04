import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function PlanCard({ product, selectedPlan, setSelectedPlan }) {
  const unitAmount = product.default_price.unit_amount_decimal
  const formattedUnitedAmount =
    unitAmount.slice(0, -2) + ',' + unitAmount.slice(-2)
    
  return (
    <div>
      <Card key={product.id} className="relative overflow-hidden mb-4">
        <CardContent>
          <div className="text-2xl font-bold text-center text-[#161311]">
            {product.name}
          </div>
          <div className="text-1x1 text-center mt-2 text-[#161311]">
            {product.description}
          </div>
          <div className="text-2xl font-bold text-center mt-2 text-[#cba11f]">{`R$ ${formattedUnitedAmount}/mês`}</div>

          <div className="mt-4">
            {product.marketing_features.map((feature) => (
              <div className="flex items-center mt-1">
                <Check className="h-4 w-4 text-green-600" />
                <p className="ml-2">{feature.name}</p>
              </div>
            ))}
          </div>
        </CardContent>

        <Button
          type="submit"
          className="w-8/12 m-auto"
          disabled={selectedPlan?.id == product.id}
          onClick={() => setSelectedPlan(product)}
        >
          {selectedPlan?.id == product.id
            ? 'Plano Selecionado'
            : 'Escolher plano'}
        </Button>

        {selectedPlan?.id == product.id && (
          <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-green-500 to-emerald-500" />
        )}
      </Card>
    </div>
  )
}
