import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react";
import { TransactionForm } from "@/components/custom/TransactionForm";
import { TransactionList } from "@/components/custom/TransactionList";
import { FinancialSummary } from "@/components/custom/FinancialSummary";

export default function Financial() {
  const [activeTab, setActiveTab] = useState("summary");
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE" | "INVESTMENT">("EXPENSE");

  const handleNewTransaction = (type: "INCOME" | "EXPENSE" | "INVESTMENT") => {
    setTransactionType(type);
    setTransactionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financeiro</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <FinancialSummary />
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
              Receitas
            </h2>
            <Button 
              onClick={() => handleNewTransaction("INCOME")}
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A]"
            >
              + Nova Receita
            </Button>
          </div>
          <TransactionList type="INCOME" />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Despesas
            </h2>
            <Button 
              onClick={() => handleNewTransaction("EXPENSE")}
              className="bg-red-600 hover:bg-red-700"
            >
              + Nova Despesa
            </Button>
          </div>
          <TransactionList type="EXPENSE" />
        </TabsContent>

        <TabsContent value="investments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-blue-600" />
              Investimentos
            </h2>
            <Button 
              onClick={() => handleNewTransaction("INVESTMENT")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Novo Investimento
            </Button>
          </div>
          <TransactionList type="INVESTMENT" />
        </TabsContent>
      </Tabs>

      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nova {transactionType === "INCOME" ? "Receita" : 
                   transactionType === "EXPENSE" ? "Despesa" : "Investimento"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm 
            type={transactionType}
            onSuccess={() => setTransactionDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}