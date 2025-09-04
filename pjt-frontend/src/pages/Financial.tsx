import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionForm } from '@/components/custom/transaction/TransactionForm'
import { RecurringExpenseForm } from '@/components/custom/recurring/RecurringExpenseForm'
import { RecurringExpensesTabContent } from '@/components/custom/recurring/RecurringExpensesTabContent'
import { FinancialSummary } from '@/components/custom/financial/FinancialSummary'
import { FinancialTabContent } from '@/components/custom/financial/FinancialTabContent'
import { FinancialProvider } from '@/contexts/FinancialContext'

export default function Financial() {
  const [activeTab, setActiveTab] = useState('summary')
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [recurringExpenseDialogOpen, setRecurringExpenseDialogOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<
    'INCOME' | 'EXPENSE' | 'INVESTMENT'
  >('EXPENSE')

  const handleNewTransaction = (type: 'INCOME' | 'EXPENSE' | 'INVESTMENT') => {
    setTransactionType(type)
    setTransactionDialogOpen(true)
  }

  // const getTabLabel = (tab: string) => {
  //   const labels = {
  //     summary: 'Resumo',
  //     income: 'Receitas',
  //     expenses: 'Despesas',
  //     investments: 'Investimentos',
  //   }
  //   return labels[tab as keyof typeof labels] || tab
  // }

  return (
    <FinancialProvider>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-3xl font-bold">Financeiro</h1>

          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-32 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Resumo</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expenses">Despesas</SelectItem>
                <SelectItem value="recurring">Despesas Fixas</SelectItem>
                <SelectItem value="investments">Investimentos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden md:grid w-full grid-cols-5">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="recurring">Despesas Fixas</TabsTrigger>
            <TabsTrigger value="investments">Investimentos</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 md:space-y-6">
            <FinancialSummary />
          </TabsContent>

          <TabsContent value="income" className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base md:text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[#D4AF37]" />
                Receitas
              </h2>
              <Button
                onClick={() => handleNewTransaction('INCOME')}
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A] w-full sm:w-auto text-sm h-8"
              >
                <span className="hidden sm:inline">+ Nova Receita</span>
                <span className="sm:hidden">+ Receita</span>
              </Button>
            </div>
            <FinancialTabContent type="INCOME" />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base md:text-xl font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                Despesas
              </h2>
              <Button
                onClick={() => handleNewTransaction('EXPENSE')}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm h-8"
              >
                <span className="hidden sm:inline">+ Nova Despesa</span>
                <span className="sm:hidden">+ Despesa</span>
              </Button>
            </div>
            <FinancialTabContent type="EXPENSE" />
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base md:text-xl font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                Despesas Fixas
              </h2>
              <Dialog open={recurringExpenseDialogOpen} onOpenChange={setRecurringExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-sm h-8"
                  >
                    <span className="hidden sm:inline">+ Nova Despesa Fixa</span>
                    <span className="sm:hidden">+ Fixa</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Despesa Fixa</DialogTitle>
                  </DialogHeader>
                  <RecurringExpenseForm onSuccess={() => setRecurringExpenseDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <RecurringExpensesTabContent />
          </TabsContent>

          <TabsContent value="investments" className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base md:text-xl font-semibold flex items-center gap-2">
                <PiggyBank className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                Investimentos
              </h2>
              <Button
                onClick={() => handleNewTransaction('INVESTMENT')}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm h-8"
              >
                <span className="hidden sm:inline">+ Novo Investimento</span>
                <span className="sm:hidden">+ Investimento</span>
              </Button>
            </div>
            <FinancialTabContent type="INVESTMENT" />
          </TabsContent>
        </Tabs>

        <Dialog
          open={transactionDialogOpen}
          onOpenChange={setTransactionDialogOpen}
        >
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Nova{' '}
                {transactionType === 'INCOME'
                  ? 'Receita'
                  : transactionType === 'EXPENSE'
                    ? 'Despesa'
                    : 'Investimento'}
              </DialogTitle>
            </DialogHeader>
            <TransactionForm
              type={transactionType}
              onSuccess={() => setTransactionDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </FinancialProvider>
  )
}
