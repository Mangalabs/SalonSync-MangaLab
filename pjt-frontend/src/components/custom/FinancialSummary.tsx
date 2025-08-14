import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";
import { useFinancial } from "@/contexts/FinancialContext";
import axios from "@/lib/axios";

export function FinancialSummary() {
  const { branches } = useBranch();
  const {
    startDate,
    endDate,
    branchFilter,
    setStartDate,
    setEndDate,
    setBranchFilter,
    resetToToday,
  } = useFinancial();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["financial-summary", startDate, endDate, branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (branchFilter !== "all") params.append("branchId", branchFilter);

      console.log('FinancialSummary fazendo requisição com params:', params.toString());
      const res = await axios.get(`/api/financial/summary?${params}`);
      console.log('FinancialSummary resposta:', res.data);
      return res.data;
    },
  });

  if (isLoading) return <div className="p-4">Carregando resumo...</div>;

  return (
    <div className="space-y-4 md:space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Calendar className="h-4 w-4 md:h-5 md:w-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {branches.length > 1 && (
              <div>
                <Label className="text-xs sm:text-sm">Filial</Label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as filiais</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <Label htmlFor="startDate" className="text-xs sm:text-sm">
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm h-8"
                />
              </div>

              <div className="flex-1 w-full">
                <Label htmlFor="endDate" className="text-xs sm:text-sm">
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm h-8"
                />
              </div>

              <Button
                variant="outline"
                onClick={resetToToday}
                className="w-full sm:w-auto text-sm h-8"
              >
                Hoje
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Receitas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-[#D4AF37]">
              R$ {summary?.totalIncome?.toFixed(2) || "0,00"}
            </div>
            <div className="text-xs text-[#737373] space-y-1">
              <p>
                Atendimentos: R${" "}
                {summary?.appointmentRevenue?.toFixed(2) || "0,00"}
              </p>
              {summary?.stockRevenue > 0 && (
                <p>
                  Vendas Estoque: R${" "}
                  {summary?.stockRevenue?.toFixed(2) || "0,00"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Despesas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-red-600">
              R$ {summary?.totalExpenses?.toFixed(2) || "0,00"}
            </div>
            <div className="text-xs text-[#737373] space-y-1">
              <p>Gastos operacionais</p>
              {summary?.stockExpenses > 0 && (
                <p>
                  Compras Estoque: R${" "}
                  {summary?.stockExpenses?.toFixed(2) || "0,00"}
                </p>
              )}
              {summary?.stockLosses > 0 && (
                <p>
                  Perdas Estoque: R${" "}
                  {summary?.stockLosses?.toFixed(2) || "0,00"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Investimentos
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              R$ {summary?.totalInvestments?.toFixed(2) || "0,00"}
            </div>
            <p className="text-xs text-[#737373]">Melhorias e equipamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Lucro Líquido
            </CardTitle>
            <DollarSign
              className={`h-4 w-4 ${
                (summary?.netProfit || 0) >= 0
                  ? "text-[#D4AF37]"
                  : "text-red-600"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg md:text-2xl font-bold ${
                (summary?.netProfit || 0) >= 0
                  ? "text-[#D4AF37]"
                  : "text-red-600"
              }`}
            >
              R$ {summary?.netProfit?.toFixed(2) || "0,00"}
            </div>
            <p className="text-xs text-[#737373]">
              Receitas - Despesas - Investimentos
            </p>
          </CardContent>
        </Card>
      </div>

      {(summary?.stockRevenue > 0 ||
        summary?.stockExpenses > 0 ||
        summary?.stockLosses > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#8B4513]" />
              Movimentações de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {summary?.stockRevenue > 0 && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-base sm:text-lg font-semibold text-green-600">
                    R$ {summary.stockRevenue.toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm text-green-700">
                    Vendas de Produtos
                  </div>
                </div>
              )}

              {summary?.stockExpenses > 0 && (
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-base sm:text-lg font-semibold text-red-600">
                    R$ {summary.stockExpenses.toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm text-red-700">
                    Compras de Produtos
                  </div>
                </div>
              )}

              {summary?.stockLosses > 0 && (
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-base sm:text-lg font-semibold text-orange-600">
                    R$ {summary.stockLosses.toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm text-orange-700">
                    Perdas de Produtos
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Receitas</span>
                <span className="font-medium text-[#D4AF37]">
                  {summary?.totalIncome
                    ? (
                        (summary.totalIncome /
                          (summary.totalIncome +
                            summary.totalExpenses +
                            summary.totalInvestments)) *
                        100
                      ).toFixed(1)
                    : "0"}
                  %
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Despesas</span>
                <span className="font-medium text-red-600">
                  {summary?.totalExpenses
                    ? (
                        (summary.totalExpenses /
                          (summary.totalIncome +
                            summary.totalExpenses +
                            summary.totalInvestments)) *
                        100
                      ).toFixed(1)
                    : "0"}
                  %
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Investimentos</span>
                <span className="font-medium text-blue-600">
                  {summary?.totalInvestments
                    ? (
                        (summary.totalInvestments /
                          (summary.totalIncome +
                            summary.totalExpenses +
                            summary.totalInvestments)) *
                        100
                      ).toFixed(1)
                    : "0"}
                  %
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
                <span
                  className={`font-medium ${
                    (summary?.netProfit || 0) >= 0
                      ? "text-[#D4AF37]"
                      : "text-red-600"
                  }`}
                >
                  {summary?.totalIncome
                    ? ((summary.netProfit / summary.totalIncome) * 100).toFixed(
                        1
                      )
                    : "0"}
                  %
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">ROI Investimentos</span>
                <span className="font-medium text-blue-600">
                  {summary?.totalInvestments && summary?.totalInvestments > 0
                    ? (
                        (summary.netProfit / summary.totalInvestments) *
                        100
                      ).toFixed(1)
                    : "0"}
                  %
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Eficiência Operacional</span>
                <span className="font-medium">
                  {summary?.totalIncome && summary?.totalExpenses
                    ? (
                        (summary.totalIncome / summary.totalExpenses) *
                        100
                      ).toFixed(0)
                    : "0"}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
