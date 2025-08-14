import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, CreditCard, User, Scissors, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import axios from "@/lib/axios";

interface FinancialTabContentProps {
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
}

export function FinancialTabContent({ type }: FinancialTabContentProps) {
  const { startDate, endDate, branchFilter } = useFinancial();
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: summary, isLoading } = useQuery({
    queryKey: ["financial-tab-data", type, startDate, endDate, branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (branchFilter !== "all") params.append("branchId", branchFilter);

      const [summaryRes, transactionsRes, appointmentsRes] = await Promise.all([
        axios.get(`/api/financial/summary?${params}`),
        axios.get(`/api/financial/transactions?type=${type}&${params}`),
        type === "INCOME"
          ? axios.get(`/api/appointments?status=COMPLETED&${params}`)
          : Promise.resolve({ data: [] }),
      ]);

      return {
        summary: summaryRes.data,
        transactions: transactionsRes.data,
        appointments: appointmentsRes.data,
      };
    },
  });

  if (isLoading) return <div className="p-4">Carregando...</div>;

  const getTypeColor = () => {
    switch (type) {
      case "INCOME": return "text-green-600";
      case "EXPENSE": return "text-red-600";
      case "INVESTMENT": return "text-blue-600";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      CASH: "Dinheiro", CARD: "Cartão", PIX: "PIX",
      TRANSFER: "Transferência", OTHER: "Outros",
    };
    return labels[method as keyof typeof labels] || method;
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

  // Calcular totais
  const totalFromTransactions = summary?.transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
  const totalFromAppointments = type === "INCOME" ? summary?.appointments?.reduce((sum: number, apt: any) => sum + Number(apt.total), 0) || 0 : 0;
  const stockRevenue = type === "INCOME" ? summary?.summary?.stockRevenue || 0 : 0;
  const stockExpenses = type === "EXPENSE" ? (summary?.summary?.stockExpenses || 0) + (summary?.summary?.stockLosses || 0) : 0;
  const grandTotal = totalFromTransactions + totalFromAppointments + stockRevenue + stockExpenses;

  // Agrupar por categoria
  const categorySummary = summary?.transactions?.reduce((acc: any, t: any) => {
    const categoryName = t.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = { total: 0, count: 0, color: t.category.color };
    }
    acc[categoryName].total += Number(t.amount);
    acc[categoryName].count += 1;
    return acc;
  }, {}) || {};

  // Filtrar transações
  const filteredTransactions = summary?.transactions?.filter((t: any) => {
    const matchesCategory = categoryFilter === "all" || t.category.name === categoryFilter;
    const matchesPayment = paymentMethodFilter === "all" || t.paymentMethod === paymentMethodFilter;
    const matchesSearch = searchTerm === "" || t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesPayment && matchesSearch;
  }) || [];

  const categories = [...new Set(summary?.transactions?.map((t: any) => t.category.name) || [])];
  const paymentMethods = [...new Set(summary?.transactions?.map((t: any) => t.paymentMethod) || [])];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTypeColor()}`}>
              {formatCurrency(grandTotal)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(startDate + 'T00:00:00').toLocaleDateString("pt-BR")} - {new Date(endDate + 'T00:00:00').toLocaleDateString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transações Manuais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{summary?.transactions?.length || 0}</div>
            <div className={`text-sm ${getTypeColor()}`}>
              {formatCurrency(totalFromTransactions)}
            </div>
          </CardContent>
        </Card>

        {type === "INCOME" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{summary?.appointments?.length || 0}</div>
              <div className="text-sm text-green-600">
                {formatCurrency(totalFromAppointments)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resumo por Categoria */}
      {Object.keys(categorySummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(categorySummary).map(([category, data]: [string, any]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: data.color }}
                    />
                    <div>
                      <div className="font-medium text-sm">{category}</div>
                      <div className="text-xs text-gray-500">{data.count} transações</div>
                    </div>
                  </div>
                  <div className={`font-semibold ${getTypeColor()}`}>
                    {formatCurrency(data.total)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Transações Detalhadas</CardTitle>
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
                placeholder="Buscar descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {getPaymentMethodLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setPaymentMethodFilter("all");
                }}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabela de Transações */}
      {filteredTransactions.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {new Date(transaction.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{transaction.description}</div>
                        {transaction.reference && (
                          <div className="text-xs text-gray-500">Ref: {transaction.reference}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: transaction.category.color + '20', color: transaction.category.color }}
                      >
                        {transaction.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${getTypeColor()}`}>
                      {formatCurrency(Number(transaction.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Nenhuma transação encontrada com os filtros aplicados
          </CardContent>
        </Card>
      )}
    </div>
  );
}