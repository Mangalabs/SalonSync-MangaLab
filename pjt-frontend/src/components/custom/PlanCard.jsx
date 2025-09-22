import { Check, Crown } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function PlanCard({ product, selectedPlan, setSelectedPlan }) {
  const unitAmount = product.default_price.unit_amount_decimal
  const formattedUnitAmount =
    unitAmount.slice(0, -2) + ',' + unitAmount.slice(-2)

  const isCurrent = selectedPlan?.id === product.id
  const noPlanSelected = !selectedPlan

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border w-full border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xl font-bold text-gray-800">{product.name}</h4>
          <p className="text-gray-500 text-sm">{product.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">{`R$ ${formattedUnitAmount}/mês`}</p>
          <span className="text-sm text-gray-400">Pagamento recorrente</span>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="font-semibold text-gray-800 mb-2">Recursos inclusos:</h5>
        <div className="space-y-1">
          {product.marketing_features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500" />
              <span>{feature.name}</span>
            </div>
          ))}
        </div>
      </div>

      {noPlanSelected && (
        <Button
          className="w-full py-2 rounded-xl font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
          onClick={() => setSelectedPlan(product)}
        >
          Escolher plano
        </Button>
      )}

      {isCurrent && (
        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700 flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-600" />
          Plano atual
        </div>
      )}
    </div>
  )
}
