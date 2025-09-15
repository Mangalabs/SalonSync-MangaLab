import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Bell, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import axios from '@/lib/axios'

interface PaymentFormData {
  amount: number;
  paymentMethod: string;
  reference?: string;
}

export function PendingExpensesNotification() {
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    amount: 0,
    paymentMethod: 'CASH',
    reference: '',
  })
  const queryClient = useQueryClient()

  const { data: pendingExpenses = [] } = useQuery({
    queryKey: ['pending-recurring-expenses'],
    queryFn: async () => {
      const res = await axios.get('/api/financial/recurring-expenses/pending')
      return res.data
    },
    refetchInterval: 5 * 60 * 1000, // Verifica a cada 5 minutos
  })

  const payExpense = useMutation({
    mutationFn: async ({ expenseId, data }: { expenseId: string; data: PaymentFormData }) => {
      const res = await axios.post(`/api/financial/recurring-expenses/${expenseId}/pay`, data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Despesa paga com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['pending-recurring-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['financial-tab-data'] })
      setSelectedExpense(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao pagar despesa')
    },
  })

  const handlePayExpense = (expense: any) => {
    setSelectedExpense(expense)
    setPaymentData({
      amount: expense.fixedAmount ? Number(expense.fixedAmount) : 0,
      paymentMethod: 'CASH',
      reference: '',
    })
  }

  const submitPayment = () => {
    if (!selectedExpense || paymentData.amount <= 0) {return}
    
    payExpense.mutate({
      expenseId: selectedExpense.id,
      data: paymentData,
    })
  }

  if (pendingExpenses.length === 0) {return null}

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <h3 className="font-medium text-orange-800">
                Despesas Fixas Pendentes ({pendingExpenses.length})
              </h3>
              <p className="text-sm text-orange-600">
                Você tem despesas fixas que venceram este mês
              </p>
            </div>
            <div className="flex gap-2">
              {pendingExpenses.slice(0, 3).map((expense: any) => (
                <Button
                  key={expense.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePayExpense(expense)}
                  className="text-xs"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  {expense.name}
                </Button>
              ))}
              {pendingExpenses.length > 3 && (
                <span className="text-sm text-orange-600 self-center">
                  +{pendingExpenses.length - 3} mais
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Despesa: {selectedExpense?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Categoria:</strong> {selectedExpense?.category?.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Vencimento:</strong> Dia {selectedExpense?.dueDay} de cada mês
              </p>
              {selectedExpense?.description && (
                <p className="text-sm text-gray-600">
                  <strong>Descrição:</strong> {selectedExpense.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Digite o valor pago"
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select 
                value={paymentData.paymentMethod} 
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Dinheiro</SelectItem>
                  <SelectItem value="CARD">Cartão</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="TRANSFER">Transferência</SelectItem>
                  <SelectItem value="OTHER">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference">Referência (opcional)</Label>
              <Input
                id="reference"
                value={paymentData.reference}
                onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Número da conta, comprovante, etc."
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedExpense(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={submitPayment}
                disabled={payExpense.isPending || paymentData.amount <= 0}
                className="flex-1"
              >
                {payExpense.isPending ? 'Pagando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}