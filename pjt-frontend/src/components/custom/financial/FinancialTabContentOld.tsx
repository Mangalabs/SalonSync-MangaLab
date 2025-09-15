import { useQuery } from '@tanstack/react-query'
import { Calendar, CreditCard, User, Scissors } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFinancial } from '@/contexts/FinancialContext'
import axios from '@/lib/axios'

interface FinancialTabContentProps {
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
}

export function FinancialTabContent({ type }: FinancialTabContentProps) {
  const { startDate, endDate, branchFilter } = useFinancial()

  const { data: summary, isLoading } = useQuery({
    queryKey: ['financial-tab-data', type, startDate, endDate, branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) {params.append('startDate', startDate)}
      if (endDate) {params.append('endDate', endDate)}
      if (branchFilter !== 'all') {params.append('branchId', branchFilter)}

      const [summaryRes, transactionsRes, appointmentsRes] = await Promise.all([
        axios.get(`/api/financial/summary?${params}`),
        axios.get(`/api/financial/transactions?type=${type}&${params}`),
        type === 'INCOME'
          ? axios.get(`/api/appointments?status=COMPLETED&${params}`)
          : Promise.resolve({ data: [] }),
      ])

      return {
        summary: summaryRes.data,
        transactions: transactionsRes.data,
        appointments: appointmentsRes.data,
      }
    },
  })

  if (isLoading) {return <div className="p-4">Carregando...</div>}

  const getTypeColor = () => {
    switch (type) {
      case 'INCOME':
        return 'bg-green-100 text-green-800'
      case 'EXPENSE':
        return 'bg-red-100 text-red-800'
      case 'INVESTMENT':
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      CASH: 'Dinheiro',
      CARD: 'Cartão',
      PIX: 'PIX',
      TRANSFER: 'Transferência',
      OTHER: 'Outros',
    }
    return labels[method as keyof typeof labels] || method
  }

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`

  const totalFromTransactions =
    summary?.transactions?.reduce(
      (sum: number, t: any) => sum + Number(t.amount),
      0,
    ) || 0
  const totalFromAppointments =
    type === 'INCOME'
      ? summary?.appointments?.reduce(
        (sum: number, apt: any) => sum + Number(apt.total),
        0,
      ) || 0
      : 0
  const stockRevenue =
    type === 'INCOME' ? summary?.summary?.stockRevenue || 0 : 0
  const stockExpenses =
    type === 'EXPENSE'
      ? (summary?.summary?.stockExpenses || 0) +
        (summary?.summary?.stockLosses || 0)
      : 0

  const grandTotal =
    totalFromTransactions +
    totalFromAppointments +
    stockRevenue +
    stockExpenses

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Total do Período</h3>
              <p className="text-sm text-gray-500">
                {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} -{' '}
                {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div
              className={`text-2xl font-bold ${
                type === 'INCOME'
                  ? 'text-green-600'
                  : type === 'EXPENSE'
                    ? 'text-red-600'
                    : 'text-blue-600'
              }`}
            >
              {formatCurrency(grandTotal)}
            </div>
          </div>
        </CardContent>
      </Card>

      {summary?.transactions?.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">
            Transações Manuais ({summary.transactions.length})
          </h4>
          {summary.transactions.map((transaction: any) => (
            <Card key={transaction.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-sm">
                        {transaction.description}
                      </h3>
                      <Badge className={getTypeColor()}>
                        {transaction.category.name}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </div>

                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                      </div>

                      {transaction.reference && (
                        <span>Ref: {transaction.reference}</span>
                      )}
                      
                      {transaction.reference && transaction.reference.startsWith('Estoque-') && (
                        <Badge variant="outline" className="text-xs">
                          Estoque Automático
                        </Badge>
                      )}
                      
                      {transaction.appointment && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                          Comissão
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div
                    className={`text-sm font-semibold ${
                      type === 'INCOME'
                        ? 'text-green-600'
                        : type === 'EXPENSE'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {formatCurrency(Number(transaction.amount))}
                  </div>
                </div>
                
                {transaction.reference && transaction.reference.startsWith('Estoque-') && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Transação gerada automaticamente por movimentação de estoque
                      </span>
                      <span className="text-gray-500">
                        Ref: {transaction.reference}
                      </span>
                    </div>
                  </div>
                )}
                
                {transaction.appointment && (
                  <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Comissão: {transaction.appointment.professional.name}
                      </span>
                      <span className="text-gray-500">
                        Cliente: {transaction.appointment.client.name}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {type === 'INCOME' && summary?.appointments?.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">
            Atendimentos ({summary.appointments.length})
          </h4>
          {summary.appointments.map((appointment: any) => (
            <Card key={appointment.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-sm">
                        {appointment.client.name}
                      </h3>
                      <Badge className="bg-purple-100 text-purple-800">
                        <Scissors className="h-3 w-3 mr-1" />
                        Atendimento
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(appointment.scheduledAt).toLocaleDateString(
                          'pt-BR',
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {appointment.professional.name}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      {appointment.appointmentServices
                        ?.map((as: any) => as.service.name)
                        .join(', ')}
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(Number(appointment.total))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {((type === 'INCOME' && stockRevenue > 0) ||
        (type === 'EXPENSE' && stockExpenses > 0)) && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">
            {type === 'INCOME'
              ? 'Vendas de Produtos'
              : 'Compras/Perdas de Produtos'}
          </h4>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">
                    {type === 'INCOME'
                      ? 'Total de Vendas'
                      : 'Total de Compras/Perdas'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Movimentações de estoque no período
                  </p>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(
                    type === 'INCOME' ? stockRevenue : stockExpenses,
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {grandTotal === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Zero{' '}
            {type === 'INCOME'
              ? 'receita'
              : type === 'EXPENSE'
                ? 'despesa'
                : 'investimento'}{' '}
            encontrada no período selecionado
          </CardContent>
        </Card>
      )}
    </div>
  )
}
