import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, ChevronDown } from "lucide-react";
import { TransactionForm } from "@/components/custom/TransactionForm";
import { FinancialSummary } from "@/components/custom/FinancialSummary";
import { FinancialTabContent } from "@/components/custom/FinancialTabContent";
import { FinancialProvider } from "@/contexts/FinancialContext";


export default function Financial() {
  const [activeTab, setActiveTab] = useState("summary");
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE" | "INVESTMENT">("EXPENSE");

  const handleNewTransaction = (type: "INCOME" | "EXPENSE" | "INVESTMENT") => {
    setTransactionType(type);
    setTransactionDialogOpen(true);
  };

  const getTabLabel = (tab: string) => {
    const labels = {
      summary: "Resumo",
      income: "Receitas", 
      expenses: "Despesas",
      investments: "Investimentos"
    };
    return labels[tab as keyof typeof labels] || tab;
  };

  return (
    <FinancialProvider>
      <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-3xl font-bold">Financeiro</h1>
        
        {/* Mobile Dropdown */}
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-28 text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Resumo</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expenses">Despesas</SelectItem>
              <SelectItem value="investments">Investimentos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 md:space-y-6">
          <FinancialSummary />
        </TabsContent>

        <TabsContent value="income" className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base md:text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[#D4AF37]" />
              Receitas
            </h2>
            <Button 
              onClick={() => handleNewTransaction("INCOME")}
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A] w-full sm:w-auto text-sm h-8"
            >
              <span className="hidden sm:inline">+ Nova Receita</span>
              <span className="sm:hidden">+ Receita</span>
            </Button>
          </div>
          <FinancialTabContent type="INCOME" />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base md:text-xl font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              Despesas
            </h2>
            <Button 
              onClick={() => handleNewTransaction("EXPENSE")}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm h-8"
            >
              <span className="hidden sm:inline">+ Nova Despesa</span>
              <span className="sm:hidden">+ Despesa</span>
            </Button>
          </div>
          <FinancialTabContent type="EXPENSE" />
        </TabsContent>

        <TabsContent value="investments" className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base md:text-xl font-semibold flex items-center gap-2">
              <PiggyBank className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              Investimentos
            </h2>
            <Button 
              onClick={() => handleNewTransaction("INVESTMENT")}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm h-8"
            >
              <span className="hidden sm:inline">+ Novo Investimento</span>
              <span className="sm:hidden">+ Investimento</span>
            </Button>
          </div>
          <FinancialTabContent type="INVESTMENT" />
        </TabsContent>
      </Tabs>

      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
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
    </FinancialProvider>
  );
}