import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TransactionForm } from '@/components/custom/transaction/TransactionForm'
import { useFinancial } from '@/contexts/FinancialContext'
import axios from '@/lib/axios'

interface FinancialTabContentProps {
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT'
}

export function FinancialTabContent({ type }: FinancialTabContentProps) {
  const { startDate, endDate, branchFilter } = useFinancial()
  const queryClient = useQueryClient()
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null)

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['financial-tab-data', type, startDate, endDate, branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }
      params.append('branchId', branchFilter)

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

  const calculations = useMemo(() => {
    if (!summary) {
      return {
        totalFromTransactions: 0,
        totalFromAppointments: 0,
        stockRevenue: 0,
        stockExpenses: 0,
        grandTotal: 0,
        categorySummary: {},
        categories: [],
        paymentMethods: [],
        allTransactions: [],
      }
    }

    const totalFromTransactions =
      summary.transactions?.reduce(
        (sum: number, t: any) => sum + Number(t.amount),
        0,
      ) || 0
    const totalFromAppointments =
      type === 'INCOME'
        ? summary.appointments?.reduce(
          (sum: number, apt: any) => sum + Number(apt.total),
          0,
        ) || 0
        : 0
    const stockRevenue =
      type === 'INCOME' ? summary.summary?.stockRevenue || 0 : 0
    const stockExpenses =
      type === 'EXPENSE'
        ? summary.summary?.stockLosses || 0
        : type === 'INVESTMENT'
          ? summary.summary?.stockExpenses || 0
          : 0
    const grandTotal =
      totalFromTransactions +
      totalFromAppointments +
      stockRevenue +
      stockExpenses

    const appointmentTransactions =
      type === 'INCOME'
        ? (summary.appointments || []).map((apt: any) => ({
          id: `appointment-${apt.id}`,
          description: `Atendimento: ${
            apt.professional?.name || 'Profissional'
          } - ${apt.client?.name || 'Cliente'}`,
          amount: apt.total,
          date: apt.scheduledAt,
          category: { name: 'Serviços', color: 'var(--color-accent)' },
          paymentMethod: 'CASH',
          reference: `Atendimento-${apt.id}`,
          isAppointment: true,
        }))
        : []

    const allTransactions = [
      ...(summary.transactions || []),
      ...appointmentTransactions,
    ]

    const categorySummary = allTransactions.reduce((acc: any, t: any) => {
      const categoryName = t.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, count: 0, color: t.category.color }
      }
      acc[categoryName].total += Number(t.amount)
      acc[categoryName].count += 1
      return acc
    }, {})

    const categories = [
      ...new Set(allTransactions.map((t: any) => t.category.name)),
    ]
    const paymentMethods = [
      ...new Set(allTransactions.map((t: any) => t.paymentMethod)),
    ]

    return {
      totalFromTransactions,
      totalFromAppointments,
      stockRevenue,
      stockExpenses,
      grandTotal,
      categorySummary,
      categories,
      paymentMethods,
      allTransactions,
    }
  }, [summary, type])

  const filteredTransactions = useMemo(
    () =>
      calculations.allTransactions?.filter((t: any) => {
        const matchesBranch =
          !branchFilter || t.branchId === branchFilter
        const matchesCategory =
          categoryFilter === 'all' || t.category.name === categoryFilter
        const matchesPayment =
          paymentMethodFilter === 'all' || t.paymentMethod === paymentMethodFilter
        const matchesSearch =
          searchTerm === '' ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesBranch && matchesCategory && matchesPayment && matchesSearch
      }) || [],
    [
      calculations.allTransactions,
      branchFilter,
      categoryFilter,
      paymentMethodFilter,
      searchTerm,
    ],
  )

  if (isLoading) {return <div className='p-4 text-foreground'>Carregando...</div>}
  if (error)
  {return (
    <div className='p-4 text-destructive'>
    Erro ao carregar dados financeiros
    </div>
  )}

  const {
    totalFromTransactions,
    totalFromAppointments,
    stockRevenue,
    stockExpenses,
    categorySummary,
    categories,
    paymentMethods,
  } = calculations

  const getTypeColor = () => {
    switch (type) {
      case 'INCOME':
        return 'text-accent-foreground'
      case 'EXPENSE':
        return 'text-destructive'
      case 'INVESTMENT':
        return 'text-primary'
    }
  }

  const getPaymentMethodLabel = (method: string) =>
    ({
      CASH: 'Dinheiro',
      CARD: 'Cartão',
      PIX: 'PIX',
      TRANSFER: 'Transferência',
      OTHER: 'Outros',
    }[method as keyof any] || method)

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`

  const handleDeleteTransaction = async (transaction: any) => {
    try {
      await axios.delete(`/api/financial/transactions/${transaction.id}`)
      toast.success('Transação excluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['financial-tab-data'] })
      setDeletingTransaction(null)
    } catch {
      toast.error('Erro ao excluir transação')
    }
  }

  const handleEditSuccess = () => {
    setEditingTransaction(null)
    queryClient.invalidateQueries({ queryKey: ['financial-tab-data'] })
  }

  return (
    <div className='space-y-6'>
      <Card className='bg-card'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-xl font-medium text-foreground'>
            {type === 'INCOME'
              ? 'Receitas'
              : type === 'EXPENSE'
                ? 'Despesas'
                : 'Investimentos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm text-muted-foreground mt-1'>
                Período:{' '}
                {(() => {
                  try {
                    const start = new Date(startDate + 'T00:00:00')
                    const end = new Date(endDate + 'T00:00:00')
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                      return 'Período inválido'
                    }
                    return `${start.toLocaleDateString(
                      'pt-BR',
                    )} - ${end.toLocaleDateString('pt-BR')}`
                  } catch {
                    return 'Período inválido'
                  }
                })()}
              </p>
            </div>
          </div>

          <div className={`text-2xl font-bold ${getTypeColor()}`}>
            Total do Período:{' '}
            {formatCurrency(
              type === 'INCOME'
                ? summary?.summary?.totalIncome || 0
                : type === 'EXPENSE'
                  ? summary?.summary?.totalExpenses || 0
                  : summary?.summary?.totalInvestments || 0,
            )}
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='bg-card'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-md font-medium text-foreground'>
              Transações Manuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-xl font-semibold text-foreground'>
              {summary?.transactions?.length || 0}
            </div>
            <div className='text-muted-foreground'>
              {formatCurrency(totalFromTransactions)}
            </div>
          </CardContent>
        </Card>

        {type === 'INCOME' && (
          <>
            <Card className='bg-card'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-md font-medium text-foreground'>
                  Atendimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-xl font-semibold text-foreground'>
                  {summary?.appointments?.length || 0}
                </div>
                <div className='text-md text-muted-foreground'>
                  {formatCurrency(totalFromAppointments)}
                </div>
              </CardContent>
            </Card>

            <Card className='bg-card'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-md font-medium text-foreground'>
                  Vendas de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-xl font-bold text-foreground'>
                  {formatCurrency(stockRevenue)}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Automático do estoque
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {type === 'EXPENSE' && (
          <Card className='bg-card'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-md font-medium text-foreground'>
                Perdas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl font-semibold text-foreground'>📉</div>
              <div className='text-sm text-destructive'>
                {formatCurrency(stockExpenses)}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                Automático do estoque
              </p>
            </CardContent>
          </Card>
        )}

        {type === 'INVESTMENT' && (
          <Card className='bg-card'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-foreground'>
                Compra de Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl font-semibold text-foreground'>🛒</div>
              <div className='text-sm text-primary'>
                {formatCurrency(stockExpenses)}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                Automático do estoque
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {Object.keys(categorySummary).length > 0 && (
        <Card className='bg-card'>
          <CardHeader>
            <CardTitle className='text-lg text-foreground'>
              Por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 grid-cols-2 gap-3'>
              {Object.entries(categorySummary).map(
                ([category, data]: [string, any]) => (
                  <div
                    key={category}
                    className='flex items-center justify-between p-3 bg-muted rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <div>
                        <div className='font-medium text-md text-foreground'>
                          {category}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {data.count} transações
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold ${getTypeColor()}`}>
                      {formatCurrency(data.total)}
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className='bg-card'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg text-foreground'>
              Transações Detalhadas
            </CardTitle>
            <Button
              className='bg-button-bg text-button-text hover:bg-button-hover'
              variant='outline'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}>
              <Filter className='h-4 w-4 mr-2' />
              Filtros
              {showFilters ? (
                <ChevronUp className='h-4 w-4 ml-2' />
              ) : (
                <ChevronDown className='h-4 w-4 ml-2' />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          {showFilters && (
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
              <Input
                placeholder='Buscar descrição...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='bg-input text-foreground'
              />

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className='bg-input text-foreground'>
                  <SelectValue placeholder='Categoria' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={String(cat)} value={String(cat)}>
                      {String(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className='bg-input text-foreground'>
                  <SelectValue placeholder='Forma de pagamento' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas as formas</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={String(method)} value={String(method)}>
                      {getPaymentMethodLabel(String(method))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className='bg-button-bg text-button-text hover:bg-button-hover'
                variant='outline'
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setPaymentMethodFilter('all')
                }}>
                Limpar
              </Button>
            </div>
          )}

          {filteredTransactions.length > 0 ? (
            <div
              className={`rounded-md overflow-x-auto ${
                filteredTransactions.length > 10
                  ? 'max-h-[500px] overflow-y-auto'
                  : ''
              }`}>
              <Table className='min-w-full text-xs sm:text-sm'>
                <TableHeader className='sticky top-0 bg-card z-10 shadow-sm'>
                  <TableRow>
                    <TableHead className='w-[60px] sm:w-[90px] text-foreground'>
                      Data
                    </TableHead>
                    <TableHead className='w-[100px] sm:w-[150px] text-foreground'>
                      Descrição
                    </TableHead>
                    <TableHead className='hidden sm:table-cell w-[80px] sm:w-[120px] text-foreground'>
                      Categoria
                    </TableHead>
                    <TableHead className='hidden md:table-cell w-[80px] sm:w-[120px] text-foreground'>
                      Pagamento
                    </TableHead>
                    <TableHead className='text-right w-[70px] sm:w-[100px] text-foreground'>
                      Valor
                    </TableHead>
                    <TableHead className='text-right w-[60px] sm:w-[90px] text-foreground'>
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className='text-[11px] sm:text-xs md:text-sm text-foreground'>
                  {filteredTransactions.map((transaction: any) => {
                    const isStockRelated =
                      transaction.reference?.startsWith('Estoque-') ||
                      transaction.reference?.startsWith('Produto-')
                    const isAppointment = transaction.isAppointment

                    return (
                      <TableRow
                        key={transaction.id}
                        className='whitespace-nowrap h-6 sm:h-7 md:h-10'>
                        <TableCell className='py-0.5 px-1 text-[10px] sm:text-[11px] md:text-sm'>
                          {(() => {
                            try {
                              const date = new Date(transaction.date)
                              return isNaN(date.getTime())
                                ? 'Data inválida'
                                : date.toLocaleDateString('pt-BR')
                            } catch {
                              return 'Data inválida'
                            }
                          })()}
                        </TableCell>

                        <TableCell className='max-w-[90px] sm:max-w-[150px] md:max-w-[250px] truncate py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                          <div className='flex flex-col'>
                            <div className='font-medium flex items-center gap-1'>
                              {isStockRelated && (
                                <span className='hidden sm:inline text-[8px] sm:text-[10px] bg-secondary text-secondary-foreground px-1 py-0.5 rounded'>
                                  📦 Estoque
                                </span>
                              )}
                              {isAppointment && (
                                <span className='hidden sm:inline text-[8px] sm:text-[10px] bg-accent text-accent-foreground px-1 py-0.5 rounded'>
                                  📅 Atendimento
                                </span>
                              )}
                              <p
                                className='truncate text-[10px] sm:text-[11px] md:text-sm'
                                title={transaction.description}>
                                {transaction.description}
                              </p>
                            </div>
                            {transaction.reference && (
                              <div className='hidden sm:block text-[9px] sm:text-[10px] text-muted-foreground truncate'>
                                Ref: {transaction.reference}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className='hidden sm:table-cell py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                          <Badge
                            variant='secondary'
                            className='truncate max-w-[80px] sm:max-w-[120px] text-[9px] sm:text-[10px] md:text-xs'
                            style={{
                              backgroundColor:
                                transaction.category.color + '20',
                              color: transaction.category.color,
                            }}>
                            {transaction.category.name}
                          </Badge>
                        </TableCell>

                        <TableCell className='hidden md:table-cell text-[10px] sm:text-[11px] truncate py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </TableCell>

                        <TableCell
                          className={`text-right font-semibold ${getTypeColor()} text-[10px] sm:text-[11px] md:text-sm py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3`}>
                          {formatCurrency(Number(transaction.amount))}
                        </TableCell>

                        <TableCell className='text-right py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                          <div className='flex items-center justify-end gap-1'>
                            {!isAppointment && (
                              <Button
                                size='icon'
                                className='p-0.5 sm:p-0.5 md:p-1 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 cursor-pointer'
                                onClick={() =>
                                  setEditingTransaction(transaction)
                                }>
                                <Edit className='w-4 h-4' />
                              </Button>
                            )}
                            <Button
                              size='icon'
                              className='p-0.5 sm:p-0.5 md:p-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8'
                              onClick={() =>
                                setDeletingTransaction(transaction)
                              }>
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='space-y-2 text-center text-muted-foreground'>
              <p>Nenhuma transação encontrada com os filtros aplicados</p>
              {type === 'INVESTMENT' && (
                <p className='text-xs text-primary'>
                  💡 Dica: Transações de investimento são criadas
                  automaticamente ao cadastrar produtos com estoque inicial
                </p>
              )}
              {type === 'INCOME' && (
                <p className='text-xs text-accent-foreground'>
                  💡 Dica: Receitas são geradas automaticamente por atendimentos
                  e vendas de produtos
                </p>
              )}
              {type === 'EXPENSE' && (
                <p className='text-xs text-destructive'>
                  💡 Dica: Despesas incluem perdas de estoque registradas
                  automaticamente
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editingTransaction}
        onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto bg-card text-foreground'>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm
              type={type}
              initialData={editingTransaction}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingTransaction}
        onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent className='bg-card text-foreground'>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação "
              {deletingTransaction?.description}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteTransaction(deletingTransaction)}
              className='bg-destructive hover:bg-destructive-foreground'>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
