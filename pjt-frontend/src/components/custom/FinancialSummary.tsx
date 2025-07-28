import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Calendar } from "lucide-react";
import axios from "@/lib/axios";

export function FinancialSummary() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: summary, isLoading } = useQuery({
    queryKey: ["financial-summary", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const res = await axios.get(`/api/financial/summary?${params}`);
      return res.data;
    },
  });

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  if (isLoading) return <div className="p-4">Carregando resumo...</div>;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <Button variant="outline" onClick={clearFilters}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {summary?.totalIncome?.toFixed(2) || "0,00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Atendimentos: R$ {summary?.appointmentRevenue?.toFixed(2) || "0,00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {summary?.totalExpenses?.toFixed(2) || "0,00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Gastos operacionais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {summary?.totalInvestments?.toFixed(2) || "0,00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Melhorias e equipamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className={`h-4 w-4 ${
              (summary?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (summary?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              R$ {summary?.netProfit?.toFixed(2) || "0,00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas - Investimentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Receitas</span>
                <span className="font-medium text-green-600">
                  {summary?.totalIncome ? 
                    ((summary.totalIncome / (summary.totalIncome + summary.totalExpenses + summary.totalInvestments)) * 100).toFixed(1) 
                    : "0"}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Despesas</span>
                <span className="font-medium text-red-600">
                  {summary?.totalExpenses ? 
                    ((summary.totalExpenses / (summary.totalIncome + summary.totalExpenses + summary.totalInvestments)) * 100).toFixed(1) 
                    : "0"}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Investimentos</span>
                <span className="font-medium text-blue-600">
                  {summary?.totalInvestments ? 
                    ((summary.totalInvestments / (summary.totalIncome + summary.totalExpenses + summary.totalInvestments)) * 100).toFixed(1) 
                    : "0"}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Margem de Lucro</span>
                <span className={`font-medium ${
                  (summary?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {summary?.totalIncome ? 
                    ((summary.netProfit / summary.totalIncome) * 100).toFixed(1) 
                    : "0"}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">ROI Investimentos</span>
                <span className="font-medium text-blue-600">
                  {summary?.totalInvestments && summary?.totalInvestments > 0 ? 
                    ((summary.netProfit / summary.totalInvestments) * 100).toFixed(1) 
                    : "0"}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Eficiência Operacional</span>
                <span className="font-medium">
                  {summary?.totalIncome && summary?.totalExpenses ? 
                    ((summary.totalIncome / summary.totalExpenses) * 100).toFixed(0) 
                    : "0"}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}