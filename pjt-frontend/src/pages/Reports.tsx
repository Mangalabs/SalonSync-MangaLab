import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

type PeriodType = 'month' | 'year';

export default function Reports() {
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const { branches } = useBranch();

  const getDateRange = () => {
    if (periodType === 'month') {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
      return { startDate, endDate };
    } else {
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`
      };
    }
  };

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["consolidated-report", periodType, selectedMonth, selectedYear],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      
      // Buscar dados financeiros
      const financialRes = await axios.get(`/api/financial/summary?startDate=${startDate}&endDate=${endDate}`);
      
      // Buscar profissionais
      const professionalsRes = await axios.get('/api/professionals');
      
      // Filtrar profissionais por filial se necessário
      const filteredProfessionals = selectedBranch === 'all' 
        ? professionalsRes.data 
        : professionalsRes.data.filter((prof: any) => prof.branchId === selectedBranch);
      
      // Buscar comissões dos profissionais filtrados
      const commissionsPromises = filteredProfessionals.map((prof: any) =>
        axios.get(`/api/professionals/${prof.id}/commission?startDate=${startDate}&endDate=${endDate}`)
          .then(res => ({ professional: prof, commission: res.data }))
          .catch(() => ({ professional: prof, commission: null }))
      );
      
      const commissionsData = await Promise.all(commissionsPromises);
      
      const branch = selectedBranch === 'all' 
        ? { name: 'Todas as Filiais' }
        : branches.find(b => b.id === selectedBranch);
      
      return {
        financial: financialRes.data,
        professionals: commissionsData.filter(item => item.commission),
        branchName: branch?.name || 'Filial Selecionada',
        period: {
          type: periodType,
          startDate,
          endDate,
          label: periodType === 'month' 
            ? new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : selectedYear
        }
      };
    },
    enabled: false
  });

  const handleGenerateReport = () => {
    refetch();
  };

  const handleExportReport = () => {
    if (!reportData) return;
    
    const reportContent = {
      filial: reportData.branchName,
      periodo: reportData.period.label,
      dataGeracao: new Date().toLocaleDateString('pt-BR'),
      resumoFinanceiro: {
        receitas: reportData.financial.totalIncome,
        despesas: reportData.financial.totalExpenses,
        investimentos: reportData.financial.totalInvestments,
        lucroLiquido: reportData.financial.netProfit,
        receitaAtendimentos: reportData.financial.appointmentRevenue
      },
      profissionais: reportData.professionals.map((item: any) => ({
        nome: item.professional.name,
        atendimentos: item.commission.summary.totalAppointments,
        receita: item.commission.summary.totalRevenue,
        comissao: item.commission.summary.totalCommission,
        percentualComissao: item.commission.professional.commissionRate
      }))
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const branchSlug = reportData.branchName.toLowerCase().replace(/\s+/g, '-');
    a.download = `relatorio-${branchSlug}-${reportData.period.type}-${reportData.period.startDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios Consolidados</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="branch">Filial</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
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
              <Label htmlFor="period">Período</Label>
              <Select value={periodType} onValueChange={(value: PeriodType) => setPeriodType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="year">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodType === 'month' && (
              <div>
                <Label htmlFor="month">Mês/Ano</Label>
                <input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-[#F5F5F0] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#737373] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}

            {periodType === 'year' && (
              <div>
                <Label htmlFor="year">Ano</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end gap-2">
              <Button onClick={handleGenerateReport} disabled={isLoading} className="flex-1">
                {isLoading ? "Gerando..." : "Gerar"}
              </Button>
              
              {reportData && (
                <Button variant="outline" onClick={handleExportReport}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{reportData.branchName} - {reportData.period.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#D4AF37]">
                    R$ {reportData.financial.totalIncome?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-sm text-[#737373]">Receitas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    R$ {reportData.financial.totalExpenses?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-sm text-[#737373]">Despesas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {reportData.financial.totalInvestments?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-sm text-[#737373]">Investimentos</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    (reportData.financial.netProfit || 0) >= 0 ? "text-[#D4AF37]" : "text-red-600"
                  }`}>
                    R$ {reportData.financial.netProfit?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-sm text-[#737373]">Lucro Líquido</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    R$ {reportData.financial.appointmentRevenue?.toFixed(2) || "0,00"}
                  </div>
                  <div className="text-sm text-[#737373]">Atendimentos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance dos Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Profissional</th>
                      {selectedBranch === 'all' && (
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
                      const professionalBranch = branches.find(b => b.id === item.professional.branchId);
                      return (
                        <tr key={item.professional.id} className="border-b">
                          <td className="p-2 font-medium">{item.professional.name}</td>
                          {selectedBranch === 'all' && (
                            <td className="p-2 text-sm text-[#737373]">
                              {professionalBranch?.name || 'N/A'}
                            </td>
                          )}
                          <td className="p-2 text-right">{item.commission.summary.totalAppointments}</td>
                          <td className="p-2 text-right">R$ {item.commission.summary.totalRevenue.toFixed(2)}</td>
                          <td className="p-2 text-right">R$ {item.commission.summary.totalCommission.toFixed(2)}</td>
                          <td className="p-2 text-right">{item.commission.professional.commissionRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}