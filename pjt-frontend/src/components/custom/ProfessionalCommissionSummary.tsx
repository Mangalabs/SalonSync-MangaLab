import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, User } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  commissionRate: number;
}

interface CommissionSummary {
  professional: {
    id: string;
    name: string;
    commissionRate: number;
  };
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    totalCommission: number;
  };
}

export function ProfessionalCommissionSummary() {
  const { activeBranch } = useBranch();
  const { user, isAdmin } = useUser();
  const today = new Date().toISOString().split('T')[0];
  
  // Buscar todos os profissionais
  const { data: professionals = [], isLoading: loadingProfessionals } = useQuery<Professional[]>({
    queryKey: ["professionals", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  // Buscar comissões do dia para cada profissional ou apenas do usuário logado
  const { data: commissions = [], isLoading: loadingCommissions } = useQuery<CommissionSummary[]>({
    queryKey: ["daily-commissions", today, activeBranch?.id, user?.id],
    queryFn: async () => {
      // Se não for admin, buscar apenas do profissional logado
      const profsToQuery = isAdmin ? professionals : professionals.filter(p => p.name === user?.name);
      
      const promises = profsToQuery.map(async (prof) => {
        try {
          const res = await axios.get(
            `/api/professionals/${prof.id}/commission?startDate=${today}&endDate=${today}`
          );
          return res.data;
        } catch (error) {
          return {
            professional: {
              id: prof.id,
              name: prof.name,
              commissionRate: prof.commissionRate || 0
            },
            summary: {
              totalAppointments: 0,
              totalRevenue: 0,
              totalCommission: 0
            }
          };
        }
      });
      
      return Promise.all(promises);
    },
    enabled: !!activeBranch && professionals.length > 0,
  });

  // Calcular total de comissões
  const totalCommission = commissions.reduce(
    (sum, item) => sum + item.summary.totalCommission,
    0
  );

  if (loadingProfessionals || loadingCommissions) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Comissões Hoje</CardTitle>
          <DollarSign className="h-4 w-4 text-[#737373]" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar por maior comissão
  const sortedCommissions = [...commissions].sort(
    (a, b) => b.summary.totalCommission - a.summary.totalCommission
  );

  // Pegar o profissional com maior comissão
  const topCommission = sortedCommissions[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {isAdmin ? "Comissões Hoje" : "Minha Comissão"}
        </CardTitle>
        <DollarSign className="h-4 w-4 text-[#737373]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#1A1A1A]">
          R$ {totalCommission.toFixed(2)}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <User className="h-3 w-3 text-[#737373]" />
          <p className="text-xs text-[#737373]">
            {isAdmin ? (
              topCommission ? (
                <>
                  <span className="font-medium">{topCommission.professional.name}</span>: R$ {topCommission.summary.totalCommission.toFixed(2)}
                </>
              ) : (
                "Nenhuma comissão hoje"
              )
            ) : (
              `${commissions.length > 0 ? commissions[0].summary.totalAppointments : 0} atendimentos hoje`
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}