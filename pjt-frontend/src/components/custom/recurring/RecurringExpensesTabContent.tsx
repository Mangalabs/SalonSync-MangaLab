import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFinancial } from '@/contexts/FinancialContext'
import axios from '@/lib/axios'

export function RecurringExpensesTabContent() {
  const { branchFilter } = useFinancial()
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: recurringExpenses = [] } = useQuery({
    queryKey: ['recurring-expenses', branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (branchFilter !== 'all') {params.append('branchId', branchFilter)}
      
      const res = await axios.get(`/api/financial/recurring-expenses?${params}`)
      return res.data
    },
  })

  const { data: salaryExpenses = [] } = useQuery({
    queryKey: ['salary-expenses-preview', branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (branchFilter !== 'all') {params.append('branchId', branchFilter)}
      
      const res = await axios.get(`/api/professionals?${params}`)
      const professionals = res.data
      
      return professionals.filter((prof: any) => 
        prof.customRole?.baseSalary || prof.baseSalary,
      ).map((prof: any) => ({
        id: prof.id,
        name: prof.name,
        role: prof.customRole?.title || prof.role,
        baseSalary: prof.customRole?.baseSalary || prof.baseSalary,
        salaryPayDay: prof.customRole?.salaryPayDay || prof.salaryPayDay,
        commissionRate: prof.customRole?.commissionRate || prof.commissionRate,
        type: 'salary',
      }))
    },
  })

  const getCurrentMonthStatus = (receiptDay: number, dueDay: number) => {
    const today = new Date().getDate()
    
    if (today < receiptDay) {
      return { status: 'upcoming', label: 'Próxima', color: 'bg-blue-100 text-blue-800' }
    } else if (today >= receiptDay && today <= dueDay) {
      return { status: 'active', label: 'Ativa', color: 'bg-orange-100 text-orange-800' }
    } else {
      return { status: 'overdue', label: 'Vencida', color: 'bg-red-100 text-red-800' }
    }
  }

  const getSalaryStatus = (payDay: number) => {
    const today = new Date().getDate()
    
    if (today < payDay) {
      return { status: 'upcoming', label: 'Próximo', color: 'bg-blue-100 text-blue-800' }
    } else if (today === payDay) {
      return { status: 'due', label: 'Hoje', color: 'bg-green-100 text-green-800' }
    } else {
      return { status: 'overdue', label: 'Pendente', color: 'bg-red-100 text-red-800' }
    }
  }

  // Combinar salários e despesas fixas
  const allExpenses = [
    ...salaryExpenses,
    ...recurringExpenses.map((expense: any) => ({ ...expense, type: 'recurring' })),
  ]

  // Calcular totais
  const totalSalaries = salaryExpenses.reduce((sum: number, s: any) => sum + Number(s.baseSalary), 0)
  const totalRecurring = recurringExpenses.reduce((sum: number, e: any) => sum + Number(e.fixedAmount || 0), 0)
  const grandTotal = totalSalaries + totalRecurring

  // Filtrar despesas
  const filteredExpenses = allExpenses.filter((expense: any) => {
    const matchesSearch = searchTerm === '' || expense.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || expense.type === typeFilter
    
    let matchesStatus = true
    if (statusFilter !== 'all') {
      const status = expense.type === 'salary' 
        ? getSalaryStatus(expense.salaryPayDay).status
        : getCurrentMonthStatus(expense.receiptDay, expense.dueDay).status
      matchesStatus = status === statusFilter
    }
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Agrupar por status
  const statusSummary = allExpenses.reduce((acc: any, expense: any) => {
    const status = expense.type === 'salary' 
      ? getSalaryStatus(expense.salaryPayDay).status
      : getCurrentMonthStatus(expense.receiptDay, expense.dueDay).status
    
    if (!acc[status]) {
      acc[status] = { count: 0, total: 0 }
    }
    acc[status].count += 1
    acc[status].total += Number(expense.type === 'salary' ? expense.baseSalary : expense.fixedAmount || 0)
    return acc
  }, {})

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(grandTotal)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Despesas fixas estimadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Salários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{salaryExpenses.length}</div>
            <div className="text-sm text-purple-600">
              {formatCurrency(totalSalaries)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas Fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{recurringExpenses.length}</div>
            <div className="text-sm text-orange-600">
              {formatCurrency(totalRecurring)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{allExpenses.length}</div>
            <div className="text-sm text-gray-600">Salários + Despesas</div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Status */}
      {Object.keys(statusSummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(statusSummary).map(([status, data]: [string, any]) => {
                const statusLabels = {
                  upcoming: { label: 'Próximas', color: 'bg-blue-50 text-blue-700' },
                  active: { label: 'Ativas', color: 'bg-orange-50 text-orange-700' },
                  due: { label: 'Hoje', color: 'bg-green-50 text-green-700' },
                  overdue: { label: 'Vencidas', color: 'bg-red-50 text-red-700' },
                }
                const statusInfo = statusLabels[status as keyof typeof statusLabels] || { label: status, color: 'bg-gray-50 text-gray-700' }
                
                return (
                  <div key={status} className={`p-3 rounded-lg ${statusInfo.color}`}>
                    <div className="font-medium text-sm">{statusInfo.label}</div>
                    <div className="text-xs text-gray-600">{data.count} itens</div>
                    <div className="font-semibold">{formatCurrency(data.total)}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Despesas Detalhadas</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="salary">Salários</SelectItem>
                  <SelectItem value="recurring">Despesas Fixas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="upcoming">Próximas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="due">Hoje</SelectItem>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
                  setStatusFilter('all')
                }}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabela de Despesas */}
      {filteredExpenses.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense: any) => {
                  const status = expense.type === 'salary' 
                    ? getSalaryStatus(expense.salaryPayDay)
                    : getCurrentMonthStatus(expense.receiptDay, expense.dueDay)
                  
                  return (
                    <TableRow key={`${expense.type}-${expense.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{expense.name}</div>
                          {expense.type === 'salary' && (
                            <div className="text-xs text-gray-500">{expense.role}</div>
                          )}
                          {expense.type === 'recurring' && expense.category && (
                            <div className="text-xs text-gray-500">{expense.category.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={expense.type === 'salary' ? 'default' : 'secondary'}>
                          {expense.type === 'salary' ? 'Salário' : 'Despesa Fixa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {expense.type === 'salary' ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Dia {expense.salaryPayDay}
                          </div>
                        ) : (
                          <div className="text-xs">
                            <div>Recebe: {expense.receiptDay}</div>
                            <div>Vence: {expense.dueDay}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        {formatCurrency(Number(expense.type === 'salary' ? expense.baseSalary : expense.fixedAmount || 0))}
                        {expense.type === 'salary' && expense.commissionRate && (
                          <div className="text-xs text-gray-500">+ {expense.commissionRate}% comissão</div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Nenhuma despesa encontrada com os filtros aplicados
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-gray-600 space-y-1">
            <p>💡 <strong>Salários:</strong> Gerados automaticamente no dia configurado (salário base + comissões do mês)</p>
            <p>📅 <strong>Despesas Fixas:</strong> Período entre data de recebimento e vencimento</p>
            <p>🔄 <strong>Status:</strong> Baseado no dia atual em relação às datas configuradas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}