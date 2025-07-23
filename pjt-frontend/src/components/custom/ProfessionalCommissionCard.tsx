import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar } from "lucide-react";

interface CommissionSummary {
  professional: {
    id: string;
    name: string;
    commissionRate: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    totalCommission: number;
  };
}

export function ProfessionalCommissionCard({ professionalId }: { professionalId: string }) {
  // Obter comissões do dia atual
  const today = new Date().toISOString().split('T')[0];
  const { data: todayCommission, isLoading: loadingToday } = useQuery<CommissionSummary>({
    queryKey: ["commission-today", professionalId, today],
    queryFn: async () => {
      const res = await axios.get(`/api/professionals/${professionalId}/commission?startDate=${today}&endDate=${today}`);
      return res.data;
    },
    enabled: !!professionalId,
  });

  // Obter comissões do mês atual
  const { data: monthCommission, isLoading: loadingMonth } = useQuery<CommissionSummary>({
    queryKey: ["commission-month", professionalId],
    queryFn: async () => {
      const res = await axios.get(`/api/professionals/${professionalId}/commission`);
      return res.data;
    },
    enabled: !!professionalId,
  });

  if (loadingToday || loadingMonth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando comissões...</div>
        </CardContent>
      </Card>
    );
  }

  if (!monthCommission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Sem dados de comissão disponíveis</div>
        </CardContent>
      </Card>
    );
  }
  
  // Se não tiver dados do dia, criar um objeto vazio com valores zerados
  const todayData = todayCommission || {
    professional: monthCommission.professional,
    period: { startDate: today, endDate: today },
    summary: { totalAppointments: 0, totalRevenue: 0, totalCommission: 0 },
    dailyCommissions: []
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Comissões ({monthCommission.professional.commissionRate}%)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <h3 className="font-medium">Hoje</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-gray-500">Atendimentos</div>
                <div className="font-medium">{todayData.summary.totalAppointments}</div>
              </div>
              <div>
                <div className="text-gray-500">Receita</div>
                <div className="font-medium">R$ {todayData.summary.totalRevenue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Comissão</div>
                <div className="font-medium text-green-600">R$ {todayData.summary.totalCommission.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <h3 className="font-medium">Este Mês</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-gray-500">Atendimentos</div>
                <div className="font-medium">{monthCommission.summary.totalAppointments}</div>
              </div>
              <div>
                <div className="text-gray-500">Receita</div>
                <div className="font-medium">R$ {monthCommission.summary.totalRevenue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Comissão</div>
                <div className="font-medium text-green-600">R$ {monthCommission.summary.totalCommission.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}