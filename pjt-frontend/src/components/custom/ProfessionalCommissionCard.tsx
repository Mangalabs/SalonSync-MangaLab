import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, BarChart3 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import axios from "@/lib/axios";

interface ProfessionalCommissionCardProps {
  professionalId?: string;
}

export function ProfessionalCommissionCard({ professionalId }: ProfessionalCommissionCardProps) {
  const { user } = useUser();

  // Buscar dados do profissional baseado no usuário logado ou ID fornecido
  const { data: professional } = useQuery({
    queryKey: ["professional", professionalId || user?.id],
    queryFn: async () => {
      if (professionalId) {
        const res = await axios.get(`/api/professionals/${professionalId}`);
        return res.data;
      }
      const res = await axios.get("/api/professionals");
      return res.data.find((prof: any) => prof.name === user?.name) || res.data[0];
    },
    enabled: !!(professionalId || (user && user.role === 'PROFESSIONAL'))
  });

  // Comissão mensal
  const { data: monthlyCommission } = useQuery({
    queryKey: ["monthly-commission", professional?.id],
    queryFn: async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const res = await axios.get(`/api/professionals/${professional.id}/commission?startDate=${startDate}&endDate=${endDate}`);
      return res.data;
    },
    enabled: !!professional
  });

  // Comissão diária (hoje)
  const { data: dailyCommission } = useQuery({
    queryKey: ["daily-commission", professional?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const res = await axios.get(`/api/professionals/${professional.id}/commission?startDate=${today}&endDate=${today}`);
      return res.data;
    },
    enabled: !!professional
  });

  if (!professional) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-[#737373]">Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cards de Comissão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-[#D4AF37]">
              R$ {monthlyCommission?.summary?.totalCommission?.toFixed(2) || "0,00"}
            </div>
            <p className="text-xs text-[#737373]">
              {monthlyCommission?.summary?.totalAppointments || 0} atendimentos este mês
            </p>
            <div className="mt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Receita gerada:</span>
                <span>R$ {monthlyCommission?.summary?.totalRevenue?.toFixed(2) || "0,00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Taxa:</span>
                <span>{monthlyCommission?.professional?.commissionRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-[#D4AF37]">
              R$ {dailyCommission?.summary?.totalCommission?.toFixed(2) || "0,00"}
            </div>
            <p className="text-xs text-[#737373]">
              {dailyCommission?.summary?.totalAppointments || 0} atendimentos hoje
            </p>
            <div className="mt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Receita gerada:</span>
                <span>R$ {dailyCommission?.summary?.totalRevenue?.toFixed(2) || "0,00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Média/atendimento:</span>
                <span>
                  R$ {dailyCommission?.summary?.totalAppointments > 0 
                    ? (dailyCommission.summary.totalRevenue / dailyCommission.summary.totalAppointments).toFixed(2)
                    : "0,00"
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Performance Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance dos Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monthlyCommission?.dailyCommissions?.slice(-7).map((day: any) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
              const dayNumber = date.getDate();
              const maxCommission = Math.max(...(monthlyCommission?.dailyCommissions || []).map((d: any) => d.commission));
              const percentage = maxCommission > 0 ? (day.commission / maxCommission) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 md:w-12 text-xs md:text-sm text-[#737373]">
                    {dayName} {dayNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-14 md:w-16 text-xs md:text-sm font-medium text-right">
                        R$ {day.commission.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-[#737373] mt-1">
                      {day.appointments} atendimento(s)
                    </div>
                  </div>
                </div>
              );
            }) || (
              <p className="text-[#737373] text-center py-4">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}