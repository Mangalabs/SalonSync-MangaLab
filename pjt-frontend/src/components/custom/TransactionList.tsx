import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, CreditCard } from "lucide-react";
import { useState } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";

interface TransactionListProps {
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
}

export function TransactionList({ type }: TransactionListProps) {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", type],
    queryFn: async () => {
      const res = await axios.get(`/api/financial/transactions?type=${type}`);
      return res.data;
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/financial/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Transação excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir transação");
    },
  });

  const getTypeColor = () => {
    switch (type) {
      case "INCOME": return "bg-green-100 text-green-800";
      case "EXPENSE": return "bg-red-100 text-red-800";
      case "INVESTMENT": return "bg-blue-100 text-blue-800";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      CASH: "Dinheiro",
      CARD: "Cartão",
      PIX: "PIX",
      TRANSFER: "Transferência",
      OTHER: "Outros"
    };
    return labels[method as keyof typeof labels] || method;
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhuma transação encontrada
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction: any) => (
        <Card key={transaction.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium">{transaction.description}</h3>
                  <Badge className={getTypeColor()}>
                    {transaction.category.name}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(transaction.date).toLocaleDateString("pt-BR")}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {getPaymentMethodLabel(transaction.paymentMethod)}
                  </div>
                  
                  {transaction.reference && (
                    <span>Ref: {transaction.reference}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`text-lg font-semibold ${
                  type === "INCOME" ? "text-green-600" : 
                  type === "EXPENSE" ? "text-red-600" : "text-blue-600"
                }`}>
                  R$ {Number(transaction.amount).toFixed(2)}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTransaction.mutate(transaction.id)}
                  disabled={deleteTransaction.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}