import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TransactionForm } from "@/components/custom/transaction/TransactionForm";
import { useFinancial } from "@/contexts/FinancialContext";
import { toast } from "sonner";
import axios from "@/lib/axios";

interface FinancialTabContentProps {
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
}

export function FinancialTabContent({ type }: FinancialTabContentProps) {
  const { startDate, endDate, branchFilter } = useFinancial();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["financial-tab-data", type, startDate, endDate, branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }
      params.append("branchId", branchFilter);

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
      };
    }

    const totalFromTransactions =
      summary.transactions?.reduce(
        (sum: number, t: any) => sum + Number(t.amount),
        0
      ) || 0;
    const totalFromAppointments =
      type === "INCOME"
        ? summary.appointments?.reduce(
            (sum: number, apt: any) => sum + Number(apt.total),
            0
          ) || 0
        : 0;
    const stockRevenue =
      type === "INCOME" ? summary.summary?.stockRevenue || 0 : 0;
    const stockExpenses =
      type === "EXPENSE"
        ? summary.summary?.stockLosses || 0
        : type === "INVESTMENT"
        ? summary.summary?.stockExpenses || 0
        : 0;
    const grandTotal =
      totalFromTransactions +
      totalFromAppointments +
      stockRevenue +
      stockExpenses;

    // Criar transações virtuais para atendimentos
    const appointmentTransactions =
      type === "INCOME"
        ? (summary.appointments || []).map((apt: any) => ({
            id: `appointment-${apt.id}`,
            description: `Atendimento: ${
              apt.professional?.name || "Profissional"
            } - ${apt.client?.name || "Cliente"}`,
            amount: apt.total,
            date: apt.scheduledAt,
            category: { name: "Serviços", color: "#10B981" },
            paymentMethod: "CASH",
            reference: `Atendimento-${apt.id}`,
            isAppointment: true,
          }))
        : [];

    // Combinar transações manuais com atendimentos
    const allTransactions = [
      ...(summary.transactions || []),
      ...appointmentTransactions,
    ];

    const categorySummary = allTransactions.reduce((acc: any, t: any) => {
      const categoryName = t.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, count: 0, color: t.category.color };
      }
      acc[categoryName].total += Number(t.amount);
      acc[categoryName].count += 1;
      return acc;
    }, {});

    const categories = [
      ...new Set(allTransactions.map((t: any) => t.category.name)),
    ];
    const paymentMethods = [
      ...new Set(allTransactions.map((t: any) => t.paymentMethod)),
    ];

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
    };
  }, [summary, type]);

  const filteredTransactions = useMemo(
    () =>
      calculations.allTransactions?.filter((t: any) => {
        const matchesCategory =
          categoryFilter === "all" || t.category.name === categoryFilter;
        const matchesPayment =
          paymentMethodFilter === "all" ||
          t.paymentMethod === paymentMethodFilter;
        const matchesSearch =
          searchTerm === "" ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesPayment && matchesSearch;
      }) || [],
    [
      calculations.allTransactions,
      categoryFilter,
      paymentMethodFilter,
      searchTerm,
    ]
  );

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }
  if (error) {
    return (
      <div className="p-4 text-red-600">Erro ao carregar dados financeiros</div>
    );
  }

  const {
    totalFromTransactions,
    totalFromAppointments,
    stockRevenue,
    stockExpenses,
    categorySummary,
    categories,
    paymentMethods,
  } = calculations;

  const getTypeColor = () => {
    switch (type) {
      case "INCOME":
        return "text-green-600";
      case "EXPENSE":
        return "text-red-600";
      case "INVESTMENT":
        return "text-blue-600";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      CASH: "Dinheiro",
      CARD: "Cartão",
      PIX: "PIX",
      TRANSFER: "Transferência",
      OTHER: "Outros",
    };
    return labels[method as keyof typeof labels] || method;
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

  const handleDeleteTransaction = async (transaction: any) => {
    try {
      await axios.delete(`/api/financial/transactions/${transaction.id}`);
      toast.success("Transação excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["financial-tab-data"] });
      setDeletingTransaction(null);
    } catch (error) {
      toast.error("Erro ao excluir transação");
    }
  };

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    queryClient.invalidateQueries({ queryKey: ["financial-tab-data"] });
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTypeColor()}`}>
              {formatCurrency(
                type === "INCOME"
                  ? summary?.summary?.totalIncome || 0
                  : type === "EXPENSE"
                  ? summary?.summary?.totalExpenses || 0
                  : summary?.summary?.totalInvestments || 0
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(() => {
                try {
                  const start = new Date(startDate + "T00:00:00");
                  const end = new Date(endDate + "T00:00:00");
                  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return "Período inválido";
                  }
                  return `${start.toLocaleDateString(
                    "pt-BR"
                  )} - ${end.toLocaleDateString("pt-BR")}`;
                } catch {
                  return "Período inválido";
                }
              })()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Transações Manuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {summary?.transactions?.length || 0}
            </div>
            <div className={`text-sm ${getTypeColor()}`}>
              {formatCurrency(totalFromTransactions)}
            </div>
          </CardContent>
        </Card>

        {type === "INCOME" && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Atendimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">
                  {summary?.appointments?.length || 0}
                </div>
                <div className="text-sm text-green-600">
                  {formatCurrency(totalFromAppointments)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Vendas de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">📦</div>
                <div className="text-sm text-green-600">
                  {formatCurrency(stockRevenue)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Automático do estoque
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {type === "EXPENSE" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Perdas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">📉</div>
              <div className="text-sm text-red-600">
                {formatCurrency(stockExpenses)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Automático do estoque
              </p>
            </CardContent>
          </Card>
        )}

        {type === "INVESTMENT" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Compra de Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">🛒</div>
              <div className="text-sm text-blue-600">
                {formatCurrency(stockExpenses)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Automático do estoque
              </p>
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
              {Object.entries(categorySummary).map(
                ([category, data]: [string, any]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <div>
                        <div className="font-medium text-sm">{category}</div>
                        <div className="text-xs text-gray-500">
                          {data.count} transações
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold ${getTypeColor()}`}>
                      {formatCurrency(data.total)}
                    </div>
                  </div>
                )
              )}
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
              {showFilters ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
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
                    <SelectItem key={String(cat)} value={String(cat)}>
                      {String(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={String(method)} value={String(method)}>
                      {getPaymentMethodLabel(String(method))}
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction: any) => {
                  const isStockRelated =
                    transaction.reference?.startsWith("Estoque-") ||
                    transaction.reference?.startsWith("Produto-");
                  const isAppointment = transaction.isAppointment;
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {(() => {
                          try {
                            const date = new Date(transaction.date);
                            return isNaN(date.getTime())
                              ? "Data inválida"
                              : date.toLocaleDateString("pt-BR");
                          } catch {
                            return "Data inválida";
                          }
                        })()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {isStockRelated && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                📦 Estoque
                              </span>
                            )}
                            {isAppointment && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                📅 Atendimento
                              </span>
                            )}
                            {transaction.description}
                          </div>
                          {transaction.reference && (
                            <div className="text-xs text-gray-500">
                              Ref: {transaction.reference}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: transaction.category.color + "20",
                            color: transaction.category.color,
                          }}
                        >
                          {transaction.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${getTypeColor()}`}
                      >
                        {formatCurrency(Number(transaction.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isAppointment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTransaction(transaction)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeletingTransaction(transaction)
                            }
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <div className="space-y-2">
              <p>Nenhuma transação encontrada com os filtros aplicados</p>
              {type === "INVESTMENT" && (
                <p className="text-xs text-blue-600">
                  💡 Dica: Transações de investimento são criadas
                  automaticamente ao cadastrar produtos com estoque inicial
                </p>
              )}
              {type === "INCOME" && (
                <p className="text-xs text-green-600">
                  💡 Dica: Receitas são geradas automaticamente por atendimentos
                  e vendas de produtos
                </p>
              )}
              {type === "EXPENSE" && (
                <p className="text-xs text-red-600">
                  💡 Dica: Despesas incluem perdas de estoque registradas
                  automaticamente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição */}
      <Dialog
        open={!!editingTransaction}
        onOpenChange={() => setEditingTransaction(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
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

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={!!deletingTransaction}
        onOpenChange={() => setDeletingTransaction(null)}
      >
        <AlertDialogContent>
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
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
