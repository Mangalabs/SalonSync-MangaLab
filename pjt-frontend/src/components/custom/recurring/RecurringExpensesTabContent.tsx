import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
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
import { RecurringExpenseForm } from '@/components/custom/recurring/RecurringExpenseForm'
import { useFinancial } from '@/contexts/FinancialContext'
import axios from '@/lib/axios'

export function RecurringExpensesTabContent() {
  const { branchFilter } = useFinancial()
  const queryClient = useQueryClient()
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [deletingExpense, setDeletingExpense] = useState<any>(null)

  const { data: recurringExpenses = [] } = useQuery({
    queryKey: ['recurring-expenses', branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (branchFilter !== 'all') {
        params.append('branchId', branchFilter)
      }
      const res = await axios.get(`/api/financial/recurring-expenses?${params}`)
      return res.data
    },
  })

  const { data: recurringCategories = [] } = useQuery({
    queryKey: ['recurring-categories', branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (branchFilter !== 'all') {
        params.append('branchId', branchFilter)
      }
      const res = await axios.get(
        `/api/financial/categories?type=RECURRING&${params}`,
      )
      return res.data
    },
  })

  const { data: salaryExpenses = [] } = useQuery({
    queryKey: ['salary-expenses-preview', branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (branchFilter !== 'all') {
        params.append('branchId', branchFilter)
      }
      const res = await axios.get(`/api/professionals?${params}`)
      const professionals = res.data
      return professionals
        .filter((prof: any) => prof.customRole?.baseSalary || prof.baseSalary)
        .map((prof: any) => ({
          id: prof.id,
          name: prof.name,
          role: prof.customRole?.title || prof.role,
          baseSalary: prof.customRole?.baseSalary || prof.baseSalary,
          salaryPayDay: prof.customRole?.salaryPayDay || prof.salaryPayDay,
          commissionRate:
            prof.customRole?.commissionRate || prof.commissionRate,
          type: 'salary',
        }))
    },
  })

  const getCurrentMonthStatus = (receiptDay: number, dueDay: number) => {
    const today = new Date().getDate()
    if (today < receiptDay) {
      return {
        status: 'upcoming',
        label: 'Próxima',
        color: 'bg-blue-100 text-blue-800',
      }
    }
    if (today >= receiptDay && today <= dueDay) {
      return {
        status: 'active',
        label: 'Ativa',
        color: 'bg-orange-100 text-orange-800',
      }
    }
    return {
      status: 'overdue',
      label: 'Vencida',
      color: 'bg-red-100 text-red-800',
    }
  }

  const getSalaryStatus = (payDay: number) => {
    const today = new Date().getDate()
    if (today < payDay) {
      return {
        status: 'upcoming',
        label: 'Próximo',
        color: 'bg-blue-100 text-blue-800',
      }
    }
    if (today === payDay) {
      return {
        status: 'due',
        label: 'Hoje',
        color: 'bg-green-100 text-green-800',
      }
    }
    return {
      status: 'overdue',
      label: 'Pendente',
      color: 'bg-red-100 text-red-800',
    }
  }

  const allExpenses = [
    ...salaryExpenses,
    ...recurringExpenses.map((expense: any) => ({
      ...expense,
      type: 'recurring',
    })),
  ]

  const categories = recurringCategories.map((cat: any) => cat.name)

  const totalSalaries = salaryExpenses.reduce(
    (sum: number, s: any) => sum + Number(s.baseSalary),
    0,
  )
  const totalRecurring = recurringExpenses.reduce(
    (sum: number, e: any) => sum + Number(e.fixedAmount || 0),
    0,
  )
  const grandTotal = totalSalaries + totalRecurring

  const filteredExpenses = allExpenses.filter((expense: any) => {
    const matchesSearch =
      searchTerm === '' ||
      expense.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || expense.type === typeFilter
    const matchesCategory =
      categoryFilter === 'all' ||
      (expense.type === 'recurring' &&
        expense.category?.name === categoryFilter) ||
      (expense.type === 'salary' && categoryFilter === 'all')
    let matchesStatus = true
    if (statusFilter !== 'all') {
      const status =
        expense.type === 'salary'
          ? getSalaryStatus(expense.salaryPayDay).status
          : getCurrentMonthStatus(expense.receiptDay, expense.dueDay).status
      matchesStatus = status === statusFilter
    }
    return matchesSearch && matchesType && matchesCategory && matchesStatus
  })

  const statusSummary = allExpenses.reduce((acc: any, expense: any) => {
    const status =
      expense.type === 'salary'
        ? getSalaryStatus(expense.salaryPayDay).status
        : getCurrentMonthStatus(expense.receiptDay, expense.dueDay).status
    if (!acc[status]) {
      acc[status] = { count: 0, total: 0 }
    }
    acc[status].count += 1
    acc[status].total += Number(
      expense.type === 'salary' ? expense.baseSalary : expense.fixedAmount || 0,
    )
    return acc
  }, {})

  const formatCurrency = (value: any) => `R$ ${Number(value || 0).toFixed(2)}`

  const handleDeleteExpense = async (expense: any) => {
    try {
      await axios.delete(`/api/financial/recurring-expenses/${expense.id}`)
      toast.success('Despesa fixa excluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
      setDeletingExpense(null)
    } catch {
      toast.error('Erro ao excluir despesa fixa')
    }
  }

  const handleEditSuccess = () => {
    setEditingExpense(null)
    queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {[
          {
            title: 'Total Mensal',
            value: grandTotal,
            color: 'text-red-600',
            subtitle: 'Despesas fixas estimadas',
          },
          {
            title: 'Salários',
            value: totalSalaries,
            color: 'text-purple-600',
            subtitle: `${salaryExpenses.length} itens`,
          },
          {
            title: 'Despesas Fixas',
            value: totalRecurring,
            color: 'text-orange-600',
            subtitle: `${recurringExpenses.length} itens`,
          },
          {
            title: 'Total de Itens',
            value: grandTotal,
            color: 'text-gray-600',
            subtitle: 'Salários + Despesas',
          },
        ].map((card, idx) => (
          <Card key={idx}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {formatCurrency(card.value)}
              </div>
              <p className='text-xs text-gray-500 mt-1'>{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(statusSummary).length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Object.entries(statusSummary).map(
            ([status, data]: [string, any]) => {
              const labels: any = {
                upcoming: {
                  label: 'Próximas',
                  color: 'bg-blue-50 text-blue-700',
                },
                active: {
                  label: 'Ativas',
                  color: 'bg-orange-50 text-orange-700',
                },
                due: { label: 'Hoje', color: 'bg-green-50 text-green-700' },
                overdue: { label: 'Vencidas', color: 'bg-red-50 text-red-700' },
              }
              const info = labels[status] || {
                label: status,
                color: 'bg-gray-50 text-gray-700',
              }
              return (
                <Card key={status} className={`${info.color}`}>
                  <CardContent>
                    <div className='font-medium text-sm'>{info.label}</div>
                    <div className='text-xs text-gray-600'>
                      {data.count} itens
                    </div>
                    <div className='font-semibold'>
                      {formatCurrency(data.total)}
                    </div>
                  </CardContent>
                </Card>
              )
            },
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg'>Despesas Detalhadas</CardTitle>
            <Button
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

        {showFilters && (
          <CardContent className='pt-0'>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-4'>
              <Input
                placeholder='Buscar nome...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Tipo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos os tipos</SelectItem>
                  <SelectItem value='salary'>Salários</SelectItem>
                  <SelectItem value='recurring'>Despesas Fixas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos os status</SelectItem>
                  <SelectItem value='upcoming'>Próximas</SelectItem>
                  <SelectItem value='active'>Ativas</SelectItem>
                  <SelectItem value='due'>Hoje</SelectItem>
                  <SelectItem value='overdue'>Vencidas</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
                  setCategoryFilter('all')
                  setStatusFilter('all')
                }}>
                Limpar
              </Button>
            </div>
          </CardContent>
        )}

        {filteredExpenses.length > 0 ? (
          <div className='rounded-md overflow-x-auto'>
            <Table className='min-w-full text-xs sm:text-sm'>
              <TableHeader className='sticky top-0 bg-white z-10 shadow-sm'>
                <TableRow>
                  <TableHead className='w-[60px] sm:w-[90px]'>Tipo</TableHead>
                  <TableHead className='w-[100px] sm:w-[150px]'>Nome</TableHead>
                  <TableHead className='hidden sm:table-cell w-[80px] sm:w-[120px]'>
                    Categoria
                  </TableHead>
                  <TableHead className='hidden md:table-cell w-[80px] sm:w-[120px]'>
                    Status
                  </TableHead>
                  <TableHead className='text-right w-[70px] sm:w-[100px]'>
                    Valor
                  </TableHead>
                  <TableHead className='text-right w-[60px] sm:w-[90px]'>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='text-[11px] sm:text-xs md:text-sm'>
                {filteredExpenses.map((expense: any) => {
                  const isSalary = expense.type === 'salary'
                  const statusInfo = isSalary
                    ? getSalaryStatus(expense.salaryPayDay)
                    : getCurrentMonthStatus(expense.receiptDay, expense.dueDay)

                  return (
                    <TableRow
                      key={expense.id}
                      className='whitespace-nowrap h-6 sm:h-7 md:h-10'>
                      <TableCell className='py-0.5 px-1 text-[10px] sm:text-[11px] md:text-sm'>
                        {isSalary ? 'Salário' : 'Despesa Fixa'}
                      </TableCell>

                      <TableCell className='max-w-[90px] sm:max-w-[150px] md:max-w-[250px] truncate py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                        <p className='truncate' title={expense.name}>
                          {expense.name}
                        </p>
                      </TableCell>

                      <TableCell className='hidden sm:table-cell py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                        {expense.type === 'recurring' &&
                          expense.category?.name && (
                          <Badge
                            variant='secondary'
                            className='truncate max-w-[80px] sm:max-w-[120px] text-[9px] sm:text-[10px] md:text-xs'>
                            {expense.category.name}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className='hidden md:table-cell text-[10px] sm:text-[11px] truncate py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                        <span
                          className={`px-1 py-0.5 rounded text-[9px] sm:text-[10px] ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </TableCell>

                      <TableCell className='text-right font-semibold text-[10px] sm:text-[11px] md:text-sm py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                        {formatCurrency(
                          Number(
                            isSalary
                              ? expense.baseSalary
                              : expense.fixedAmount || 0,
                          ),
                        )}
                      </TableCell>

                      <TableCell className='text-right py-0.5 px-1 sm:py-1 sm:px-2 md:py-2 md:px-3'>
                        <div className='flex items-center justify-end gap-0.5 sm:gap-1 md:gap-2'>
                          <Button
                            size='icon'
                            className='p-0.5 sm:p-0.5 md:p-1 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8'
                            onClick={() => setEditingExpense(expense)}>
                            <Edit className='w-2 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4' />
                          </Button>
                          <Button
                            size='icon'
                            className='p-0.5 sm:p-0.5 md:p-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8'
                            onClick={() => setDeletingExpense(expense)}>
                            <Trash2 className='w-2 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4' />
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
          <div className='space-y-2 text-center text-gray-500'>
            <p>Nenhuma despesa encontrada com os filtros aplicados</p>
          </div>
        )}
      </Card>

      <Dialog
        open={!!editingExpense}
        onOpenChange={() => setEditingExpense(null)}>
        <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Editar Despesa Fixa</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <RecurringExpenseForm
              initialData={editingExpense}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingExpense}
        onOpenChange={() => setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a despesa fixa "
              {deletingExpense?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteExpense(deletingExpense)}
              className='bg-red-600 hover:bg-red-700'>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardContent className='p-4'>
          <div className='text-xs text-gray-600 space-y-1'>
            <p>
              💡 <strong>Salários:</strong> Gerados automaticamente no dia
              configurado (salário base + comissões do mês)
            </p>
            <p>
              📅 <strong>Despesas Fixas:</strong> Período entre data de
              recebimento e vencimento
            </p>
            <p>
              🔄 <strong>Status:</strong> Baseado no dia atual em relação às
              datas configuradas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
