import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";
import { useUser } from "@/contexts/UserContext";
import axios from "@/lib/axios";

export function FinancialSummaryTest() {
  const { branches, activeBranch } = useBranch();
  const { isAdmin } = useUser();
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ["financial-summary-test", startDate, endDate, selectedBranch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedBranch !== "all") params.append("branchId", selectedBranch);

      console.log("Fazendo requisição com parâmetros:", params.toString());
      const res = await axios.get(`/api/financial/summary?${params}`);
      console.log("Resposta recebida:", res.data);
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Teste do Filtro de Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Filial</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
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
          </div>

          <div className="text-sm space-y-2">
            <p><strong>Usuário Admin:</strong> {isAdmin ? "Sim" : "Não"}</p>
            <p><strong>Filial Ativa:</strong> {activeBranch?.name}</p>
            <p><strong>Filial Selecionada:</strong> {selectedBranch === "all" ? "Todas" : branches.find(b => b.id === selectedBranch)?.name}</p>
            <p><strong>Total de Filiais:</strong> {branches.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado do Teste</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Carregando...</p>}
          {error && <p className="text-red-500">Erro: {error.message}</p>}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-lg font-semibold text-green-600">
                  R$ {summary.totalIncome?.toFixed(2) || "0,00"}
                </div>
                <div className="text-sm text-green-700">Receitas</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-lg font-semibold text-red-600">
                  R$ {summary.totalExpenses?.toFixed(2) || "0,00"}
                </div>
                <div className="text-sm text-red-700">Despesas</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-lg font-semibold text-blue-600">
                  R$ {summary.totalInvestments?.toFixed(2) || "0,00"}
                </div>
                <div className="text-sm text-blue-700">Investimentos</div>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className={`text-lg font-semibold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {summary.netProfit?.toFixed(2) || "0,00"}
                </div>
                <div className="text-sm text-gray-700">Lucro Líquido</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}