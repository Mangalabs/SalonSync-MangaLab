import { useQuery } from '@tanstack/react-query'
import { Calendar, DollarSign, Users, Clock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import axios from '@/lib/axios'

export function RecurringExpensesTabContent() {
  const { data: recurringExpenses = [] } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: async () => {
      const res = await axios.get('/api/financial/recurring-expenses')
      return res.data
    },
  })

  const { data: salaryExpenses = [] } = useQuery({
    queryKey: ['salary-expenses-preview'],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      const professionals = res.data
      
      // Filtrar profissionais com salário configurado
      return professionals.filter((prof: any) => 
        prof.customRole?.baseSalary || prof.baseSalary,
      ).map((prof: any) => ({
        id: prof.id,
        name: prof.name,
        role: prof.customRole?.title || prof.role,
        baseSalary: prof.customRole?.baseSalary || prof.baseSalary,
        salaryPayDay: prof.customRole?.salaryPayDay || prof.salaryPayDay,
        commissionRate: prof.customRole?.commissionRate || prof.commissionRate,
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

  return (
    <div className="space-y-6">
      {/* Salários Automáticos */}
      {salaryExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Salários Automáticos ({salaryExpenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {salaryExpenses.map((salary: any) => {
                const status = getSalaryStatus(salary.salaryPayDay)
                
                return (
                  <div key={salary.id} className="flex items-center justify-between p-3 border rounded-lg bg-purple-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{salary.name}</h4>
                        <Badge className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="font-medium">{salary.role}</span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {Number(salary.baseSalary).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{salary.commissionRate}% comissão</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Dia {salary.salaryPayDay}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Salários são gerados automaticamente no dia configurado (salário base + comissões do mês)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Despesas Fixas Tradicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Despesas Fixas Tradicionais ({recurringExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recurringExpenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma despesa fixa cadastrada
            </p>
          ) : (
            <div className="grid gap-3">
              {recurringExpenses.map((expense: any) => {
                const status = getCurrentMonthStatus(expense.receiptDay, expense.dueDay)
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{expense.name}</h4>
                        <Badge className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Recebe: {expense.receiptDay}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Vence: {expense.dueDay}
                        </div>
                        {expense.fixedAmount && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {Number(expense.fixedAmount).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{expense.category.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}