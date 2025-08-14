import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Clock } from "lucide-react";
import axios from "@/lib/axios";

export function RecurringExpensesList() {
  const { data: allRecurringExpenses = [] } = useQuery({
    queryKey: ["recurring-expenses"],
    queryFn: async () => {
      const res = await axios.get("/api/financial/recurring-expenses");
      return res.data;
    },
  });

  const getCurrentMonthStatus = (receiptDay: number, dueDay: number) => {
    const today = new Date().getDate();
    
    if (today < receiptDay) {
      return { status: "upcoming", label: "Próxima", color: "text-blue-600", inPeriod: false };
    } else if (today >= receiptDay && today <= dueDay) {
      return { status: "active", label: "Ativa", color: "text-orange-600", inPeriod: true };
    } else {
      return { status: "overdue", label: "Vencida", color: "text-red-600", inPeriod: true };
    }
  };

  // Filtrar apenas despesas no período de cobrança (ativas ou vencidas)
  const recurringExpenses = allRecurringExpenses.filter((expense: any) => {
    const status = getCurrentMonthStatus(expense.receiptDay, expense.dueDay);
    return status.inPeriod;
  });

  if (recurringExpenses.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Despesas no Período ({recurringExpenses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recurringExpenses.map((expense: any) => {
            const status = getCurrentMonthStatus(expense.receiptDay, expense.dueDay);
            
            return (
              <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{expense.name}</h4>
                    <span className={`text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
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
                        {expense.professional && <span className="text-purple-600">+comissões</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600">{expense.category.name}</p>
                    {expense.professional && (
                      <p className="text-xs text-purple-600 font-medium">{expense.professional.name}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}