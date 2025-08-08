import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Calendar, Bot } from "lucide-react";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";
import { ExportButton } from "@/components/custom/ExportButton";
import { ExportService } from "@/services/exportService";

export default function Reports() {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const { branches } = useBranch();

  const formatPeriodLabel = () => {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    return `${start.toLocaleDateString("pt-BR")} - ${end.toLocaleDateString(
      "pt-BR"
    )}`;
  };

  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["consolidated-report", startDate, endDate, selectedBranch],
    queryFn: async () => {
      // Buscar dados financeiros
      const financialRes = await axios.get(
        `/api/financial/summary?startDate=${startDate}&endDate=${endDate}`
      );

      // Buscar movimentações de estoque
      const stockRes = await axios.get(
        `/api/inventory/movements?startDate=${startDate}&endDate=${endDate}`
      );

      // Buscar profissionais
      const professionalsRes = await axios.get("/api/professionals");

      // Filtrar profissionais por filial se necessário
      const filteredProfessionals =
        selectedBranch === "all"
          ? professionalsRes.data
          : professionalsRes.data.filter(
              (prof: any) => prof.branchId === selectedBranch
            );

      // Buscar comissões dos profissionais filtrados
      const commissionsPromises = filteredProfessionals.map((prof: any) =>
        axios
          .get(
            `/api/professionals/${prof.id}/commission?startDate=${startDate}&endDate=${endDate}`
          )
          .then((res) => ({ professional: prof, commission: res.data }))
          .catch(() => ({ professional: prof, commission: null }))
      );

      const commissionsData = await Promise.all(commissionsPromises);

      // Processar movimentações de estoque
      const stockMovements = stockRes.data || [];
      const stockSummary = {
        totalPurchases: stockMovements
          .filter((m: any) => m.type === "IN")
          .reduce(
            (sum: number, m: any) => sum + m.quantity * Number(m.unitCost),
            0
          ),
        totalSales: stockMovements
          .filter((m: any) => m.type === "OUT")
          .reduce(
            (sum: number, m: any) => sum + m.quantity * Number(m.unitCost),
            0
          ),
        totalMovements: stockMovements.length,
      };

      const branch =
        selectedBranch === "all"
          ? { name: "Todas as Filiais" }
          : branches.find((b) => b.id === selectedBranch);

      return {
        financial: financialRes.data,
        stock: {
          movements: stockMovements,
          summary: stockSummary,
        },
        professionals: commissionsData.filter((item) => item.commission),
        branchName: branch?.name || "Filial Selecionada",
        period: {
          startDate,
          endDate,
          label: formatPeriodLabel(),
        },
      };
    },
    enabled: false,
  });

  const {
    data: insights,
    isLoading: isLoadingInsights,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ["insight-query", startDate, endDate, selectedBranch],
    queryFn: async () => {
      const insightsResponse = await axios.get(
        `/api/ai/insights?startDate=${startDate}&endDate=${endDate}`
      );

      const insights = insightsResponse.data.map((insightResponse: string) => {
        const insightInformation = insightResponse.split(":");
        return {
          title: insightInformation[0],
          description: insightInformation[1],
        };
      });

      return insights;
    },
    enabled: false,
  });

  const handleGenerateReport = () => {
    refetch();
  };

  const handleGenerateInsight = () => {
    refetchInsights();
  };

  const handleExportReport = (format: "json" | "pdf" | "csv" | "excel") => {
    if (!reportData) return;

    switch (format) {
      case "json":
        ExportService.exportJSON(reportData);
        break;
      case "pdf":
        ExportService.exportPDF(reportData);
        break;
      case "csv":
        ExportService.exportCSV(reportData);
        break;
      case "excel":
        ExportService.exportExcel(reportData);
        break;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-3xl font-bold">
          Relatórios Consolidados
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="branch" className="text-sm">
                  Filial
                </Label>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Filiais</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate" className="text-sm">
                  Data Inicial
                </Label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#737373] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="text-sm">
                  Data Final
                </Label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#737373] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={isLoading || reportData}
                className="text-sm"
              >
                {isLoading ? "Gerando..." : "Gerar Relatório"}
              </Button>

              {reportData && (
                <Button
                  onClick={handleGenerateInsight}
                  disabled={isLoadingInsights || insights}
                  className="text-sm bg-blue-700"
                >
                  {isLoadingInsights ? (
                    "Gerando..."
                  ) : (
                    <>
                      <Bot size={44} />
                      Gerar Insights de IA
                    </>
                  )}
                </Button>
              )}

              {reportData && <ExportButton onExport={handleExportReport} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-5 md:gap-4 text-center">
              {insights.map(
                (insight: { title: string; description: string }) => (
                  <div
                    key={insight.title}
                    className="bg-white border wrap-anywhere rounded-lg p-3"
                  >
                    <div className="text-lg md:text-lg font-bold text-blue-700 mb-5">
                      {insight.title}
                    </div>
                    <div className="text-xs md:text-sm text-justify text-stone-900">
                      {insight.description}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && (
        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                {reportData.branchName} - {reportData.period.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-5 md:gap-4 text-center">
                <div className="bg-white border rounded-lg p-3">
                  <div className="text-lg md:text-2xl font-bold text-[#D4AF37] truncate">
                    R$ {reportData.financial.totalIncome?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-xs md:text-sm text-[#737373]">
                    Receitas
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <div className="text-lg md:text-2xl font-bold text-red-600 truncate">
                    R${" "}
                    {reportData.financial.totalExpenses?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-xs md:text-sm text-[#737373]">
                    Despesas
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <div className="text-lg md:text-2xl font-bold text-blue-600 truncate">
                    R${" "}
                    {reportData.financial.totalInvestments?.toFixed(2) ||
                      "0,00"}
                  </div>
                  <div className="text-xs md:text-sm text-[#737373]">
                    Investimentos
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <div
                    className={`text-lg md:text-2xl font-bold truncate ${
                      (reportData.financial.netProfit || 0) >= 0
                        ? "text-[#D4AF37]"
                        : "text-red-600"
                    }`}
                  >
                    R$ {reportData.financial.netProfit?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-xs md:text-sm text-[#737373]">
                    Lucro Líquido
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <div className="text-lg md:text-2xl font-bold text-purple-600 truncate">
                    R${" "}
                    {reportData.financial.appointmentRevenue?.toFixed(2) ||
                      "0,00"}
                  </div>
                  <div className="text-xs md:text-sm text-[#737373]">
                    Atendimentos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Movimentação de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-center mb-4 md:mb-6">
                <div>
                  <div className="text-lg md:text-2xl font-bold text-red-600">
                    R${" "}
                    {reportData.stock.summary.totalPurchases?.toFixed(2) ||
                      "0,00"}
                  </div>
                  <div className="text-xs md:text-sm text-[#737373]">
                    Compras
                  </div>
                </div>
                <div>
                  <div className="text-lg md:text-2xl font-bold text-[#D4AF37]">
                    R${" "}
                    {reportData.stock.summary.totalSales?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-xs md:text-sm text-[#737373]">
                    Vendas
                  </div>
                </div>
                <div>
                  <div className="text-lg md:text-2xl font-bold text-blue-600">
                    {reportData.stock.summary.totalMovements || 0}
                  </div>
                  <div className="text-xs md:text-sm text-[#737373]">
                    Movimentações
                  </div>
                </div>
              </div>

              {reportData.stock.movements.length > 0 && (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Data</th>
                          <th className="text-left p-2">Produto</th>
                          <th className="text-center p-2">Tipo</th>
                          <th className="text-right p-2">Qtd</th>
                          <th className="text-right p-2">Valor Unit.</th>
                          <th className="text-right p-2">Total</th>
                          <th className="text-left p-2">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.stock.movements
                          .slice(0, 10)
                          .map((movement: any) => (
                            <tr key={movement.id} className="border-b">
                              <td className="p-2 text-sm">
                                {new Date(
                                  movement.createdAt
                                ).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="p-2 font-medium">
                                {movement.product.name}
                              </td>
                              <td className="p-2 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    movement.type === "IN"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {movement.type === "IN" ? "Entrada" : "Saída"}
                                </span>
                              </td>
                              <td className="p-2 text-right">
                                {movement.quantity}
                              </td>
                              <td className="p-2 text-right">
                                R$ {Number(movement.unitCost).toFixed(2)}
                              </td>
                              <td className="p-2 text-right font-medium">
                                R${" "}
                                {(
                                  movement.quantity * Number(movement.unitCost)
                                ).toFixed(2)}
                              </td>
                              <td className="p-2 text-sm text-[#737373]">
                                {movement.reason.length > 30
                                  ? `${movement.reason.substring(0, 30)}...`
                                  : movement.reason}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {reportData.stock.movements
                      .slice(0, 5)
                      .map((movement: any) => (
                        <div
                          key={movement.id}
                          className="bg-white border rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                {movement.product.name}
                              </h4>
                              <p className="text-xs text-[#737373]">
                                {new Date(
                                  movement.createdAt
                                ).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                movement.type === "IN"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {movement.type === "IN" ? "Entrada" : "Saída"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-[#737373]">
                              Quantidade:
                            </span>
                            <span className="font-medium text-sm">
                              {movement.quantity}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-[#737373]">
                              Total:
                            </span>
                            <span className="font-medium text-sm text-[#D4AF37]">
                              R${" "}
                              {(
                                movement.quantity * Number(movement.unitCost)
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="text-xs text-[#737373]">
                            <strong>Motivo:</strong>{" "}
                            {movement.reason.length > 40
                              ? `${movement.reason.substring(0, 40)}...`
                              : movement.reason}
                          </div>
                        </div>
                      ))}
                  </div>

                  {reportData.stock.movements.length > 10 && (
                    <p className="text-sm text-[#737373] mt-2 text-center">
                      Mostrando{" "}
                      {reportData.stock.movements.length > 5 ? "10" : "5"} de{" "}
                      {reportData.stock.movements.length} movimentações
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance dos Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Profissional</th>
                      {selectedBranch === "all" && (
                        <th className="text-left p-2">Filial</th>
                      )}
                      <th className="text-right p-2">Atendimentos</th>
                      <th className="text-right p-2">Receita</th>
                      <th className="text-right p-2">Comissão</th>
                      <th className="text-right p-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.professionals.map((item: any) => {
                      const professionalBranch = branches.find(
                        (b) => b.id === item.professional.branchId
                      );
                      return (
                        <tr key={item.professional.id} className="border-b">
                          <td className="p-2 font-medium">
                            {item.professional.name}
                          </td>
                          {selectedBranch === "all" && (
                            <td className="p-2 text-sm text-[#737373]">
                              {professionalBranch?.name || "N/A"}
                            </td>
                          )}
                          <td className="p-2 text-right">
                            {item.commission.summary.totalAppointments}
                          </td>
                          <td className="p-2 text-right">
                            R$ {item.commission.summary.totalRevenue.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            R${" "}
                            {item.commission.summary.totalCommission.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            {item.commission.professional.commissionRate}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {reportData.professionals.map((item: any) => {
                  const professionalBranch = branches.find(
                    (b) => b.id === item.professional.branchId
                  );
                  return (
                    <div
                      key={item.professional.id}
                      className="bg-white border rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {item.professional.name}
                          </h4>
                          {selectedBranch === "all" && (
                            <p className="text-xs text-[#737373]">
                              {professionalBranch?.name || "N/A"}
                            </p>
                          )}
                        </div>
                        <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-1 rounded">
                          {item.commission.professional.commissionRate}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-sm font-medium">
                            {item.commission.summary.totalAppointments}
                          </div>
                          <div className="text-xs text-[#737373]">
                            Atendimentos
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#D4AF37]">
                            R$ {item.commission.summary.totalRevenue.toFixed(2)}
                          </div>
                          <div className="text-xs text-[#737373]">Receita</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-600">
                            R${" "}
                            {item.commission.summary.totalCommission.toFixed(2)}
                          </div>
                          <div className="text-xs text-[#737373]">Comissão</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
