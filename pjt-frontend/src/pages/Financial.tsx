import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PieChart,
  Calendar,
  Target,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TransactionForm } from '@/components/custom/transaction/TransactionForm'
import { RecurringExpenseForm } from '@/components/custom/recurring/RecurringExpenseForm'
import { RecurringExpensesTabContent } from '@/components/custom/recurring/RecurringExpensesTabContent'
import { FinancialSummary } from '@/components/custom/financial/FinancialSummary'
import { FinancialTabContent } from '@/components/custom/financial/FinancialTabContent'
import { FinancialProvider, useFinancial } from '@/contexts/FinancialContext'
import { useBranch } from '@/contexts/BranchContext'

function PeriodFilter() {
  const { activeBranch } = useBranch()
  const { startDate, endDate, setStartDate, setEndDate, resetToToday } =
    useFinancial()

  return (
    <div className='space-y-3 bg-card p-4 rounded-2xl shadow-sm border border-border'>
      <h2 className='flex items-center gap-2 font-medium text-muted-foreground'>
        <Calendar className='h-4 w-4' /> Período{' '}
        {activeBranch ? `(${activeBranch.name})` : ''}
      </h2>

      <div className='flex flex-col sm:flex-row items-end gap-3'>
        <div className='flex-1'>
          <Label htmlFor='startDate' className='text-xs text-muted-foreground'>
            Data Inicial
          </Label>
          <Input
            id='startDate'
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className='text-sm h-8 bg-input text-foreground border border-border'
          />
        </div>

        <div className='flex-1'>
          <Label htmlFor='endDate' className='text-xs text-muted-foreground'>
            Data Final
          </Label>
          <Input
            id='endDate'
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className='text-sm h-8 bg-input text-foreground border border-border'
          />
        </div>

        <Button
          variant='outline'
          onClick={resetToToday}
          className='w-full sm:w-auto text-sm h-8 bg-card text-foreground border border-border hover:bg-muted'>
          Hoje
        </Button>
      </div>
    </div>
  )
}

export default function Financial() {
  const [activeTab, setActiveTab] = useState('summary')
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [recurringExpenseDialogOpen, setRecurringExpenseDialogOpen] =
    useState(false)
  const [transactionType, setTransactionType] = useState<
    'INCOME' | 'EXPENSE' | 'INVESTMENT'
  >('EXPENSE')

  const handleNewTransaction = (type: 'INCOME' | 'EXPENSE' | 'INVESTMENT') => {
    setTransactionType(type)
    setTransactionDialogOpen(true)
  }

  const tabs = [
    { id: 'summary', label: 'Resumo', icon: PieChart },
    { id: 'income', label: 'Receitas', icon: TrendingUp },
    { id: 'expenses', label: 'Despesas', icon: TrendingDown },
    { id: 'recurring', label: 'Despesas Fixas', icon: Calendar },
    { id: 'investments', label: 'Investimentos', icon: Target },
  ]

  return (
    <FinancialProvider>
      <div className='space-y-4 md:space-y-6 mt-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl md:text-3xl font-bold text-foreground'>
            Financeiro
          </h1>
        </div>

        <PeriodFilter />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='bg-card w-full grid-cols-5 rounded-2xl shadow-sm border border-border flex flex-wrap'>
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm md:text-base
                    ${
                activeTab === tab.id
                  ? 'bg-primary text-primary shadow-md'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer'
                }`}>
                  <IconComponent className='w-4 h-4 md:w-5 md:h-5 flex-shrink-0' />
                  <span
                    className='
                      hidden sm:inline truncate
                      text-xs sm:text-sm md:text-base
                    '>
                    {tab.label}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value='summary' className='space-y-4 md:space-y-6'>
            <FinancialSummary
              onNewTransaction={handleNewTransaction}
              onNewRecurringExpense={() => setRecurringExpenseDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value='income' className='space-y-4 md:space-y-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <h2 className='text-base md:text-xl font-semibold flex items-center gap-2 text-foreground'>
                <TrendingUp className='h-4 w-4 md:h-5 md:w-5 text-primary' />
                Receitas
              </h2>
              <Button
                onClick={() => handleNewTransaction('INCOME')}
                className='bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:opacity-60 transition-opacity flex items-center gap-2 cursor-pointer'>
                <span className='hidden sm:inline'>+ Nova Receita</span>
                <span className='sm:hidden'>+ Receita</span>
              </Button>
            </div>
            <FinancialTabContent type='INCOME' />
          </TabsContent>

          <TabsContent value='expenses' className='space-y-4 md:space-y-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <h2 className='text-base md:text-xl font-semibold flex items-center gap-2 text-foreground'>
                <TrendingDown className='h-4 w-4 md:h-5 md:w-5 text-destructive' />
                Despesas
              </h2>
              <Button
                onClick={() => handleNewTransaction('EXPENSE')}
                className='px-10 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:opacity-60 transition-opacity flex items-center gap-2 cursor-pointer'>
                <span className='hidden sm:inline'>+ Nova Despesa</span>
                <span className='sm:hidden'>+ Despesa</span>
              </Button>
            </div>
            <FinancialTabContent type='EXPENSE' />
          </TabsContent>

          <TabsContent value='recurring' className='space-y-4 md:space-y-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <h2 className='text-base md:text-xl font-semibold flex items-center gap-2 text-foreground'>
                <TrendingDown className='h-4 w-4 md:h-5 md:w-5 text-primary' />
                Despesas Fixas
              </h2>
              <Dialog
                open={recurringExpenseDialogOpen}
                onOpenChange={setRecurringExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='px-10 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-60 transition-opacity flex items-center gap-2 cursor-pointer'>
                    <span className='hidden sm:inline'>
                      + Nova Despesa Fixa
                    </span>
                    <span className='sm:hidden'>+ Fixa</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className='bg-card text-foreground border border-border'>
                  <DialogHeader>
                    <DialogTitle className='text-foreground'>
                      Nova Despesa Fixa
                    </DialogTitle>
                  </DialogHeader>
                  <RecurringExpenseForm
                    onSuccess={() => setRecurringExpenseDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <RecurringExpensesTabContent />
          </TabsContent>

          <TabsContent value='investments' className='space-y-4 md:space-y-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <h2 className='text-base md:text-xl font-semibold flex items-center gap-2 text-foreground'>
                <PiggyBank className='h-4 w-4 md:h-5 md:w-5 text-primary' />
                Investimentos
              </h2>
              <Button
                onClick={() => handleNewTransaction('INVESTMENT')}
                className='px-10 py-5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-60 transition-opacity flex items-center gap-2 cursor-pointer'>
                <span className='hidden sm:inline'>+ Novo Investimento</span>
                <span className='sm:hidden'>+ Investimento</span>
              </Button>
            </div>
            <FinancialTabContent type='INVESTMENT' />
          </TabsContent>
        </Tabs>

        <Dialog
          open={transactionDialogOpen}
          onOpenChange={setTransactionDialogOpen}>
          <DialogContent className='bg-card text-foreground border border-border'>
            <DialogHeader>
              <DialogTitle className='text-foreground'>
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

        <Dialog
          open={recurringExpenseDialogOpen}
          onOpenChange={setRecurringExpenseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Despesa Fixa</DialogTitle>
            </DialogHeader>
            <RecurringExpenseForm
              onSuccess={() => setRecurringExpenseDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </FinancialProvider>
  )
}
