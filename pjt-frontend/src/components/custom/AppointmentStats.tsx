import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";
import { useUser } from "@/contexts/UserContext";

interface AppointmentStatsProps {
  appointments: any[];
}

export function AppointmentStats({ appointments }: AppointmentStatsProps) {
  const { activeBranch } = useBranch();
  const { isAdmin, user } = useUser();

  const { data: professionals = [], isLoading: professionalsLoading } = useQuery({
    queryKey: ["professionals", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const completedAppointments = appointments.filter(apt => apt.status === "COMPLETED");

  if (isAdmin) {
    // Calcular top profissional
    const professionalStats = professionals.map(prof => {
      const profAppointments = completedAppointments.filter(apt => apt.professional.name === prof.name);
      return {
        name: prof.name,
        count: profAppointments.length,
      };
    });
    
    const topProfessional = professionalStats.reduce((top, current) => 
      current.count > top.count ? current : top, 
      { name: "N/A", count: 0 }
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-4 rounded-lg border text-center">
          <div className="text-lg md:text-2xl font-bold text-[#D4AF37]">
            {completedAppointments.length}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Total de Atendimentos</div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-lg border text-center">
          <div className="text-lg md:text-2xl font-bold text-orange-600 truncate">
            {topProfessional.name}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Top Profissional</div>
        </div>
      </div>
    );
  }

  // Para profissional
  const professionalAppointments = completedAppointments.filter(
    apt => apt.professional.name === user?.name
  );
  
  // Encontrar dados do profissional logado na lista (buscar por nome)
  const currentProfessional = professionals.find(prof => prof.name === user?.name);
  
  // Calcular comissão total baseada nos atendimentos
  const totalRevenue = professionalAppointments.reduce((sum, apt) => sum + Number(apt.total), 0);
  const commissionRate = Number(currentProfessional?.commissionRate) || 0;
  const totalCommission = (totalRevenue * commissionRate) / 100;
  


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      <div className="bg-white p-3 md:p-4 rounded-lg border text-center">
        <div className="text-lg md:text-2xl font-bold text-[#D4AF37]">
          {professionalAppointments.length}
        </div>
        <div className="text-xs md:text-sm text-gray-600">Meus Atendimentos</div>
      </div>

      <div className="bg-white p-3 md:p-4 rounded-lg border text-center">
        <div className="text-lg md:text-2xl font-bold text-green-600">
          {professionalsLoading ? (
            "Carregando..."
          ) : (
            `R$ ${totalCommission.toFixed(2)}`
          )}
        </div>
        <div className="text-xs md:text-sm text-gray-600">Total de Comissão</div>
      </div>
    </div>
  );
}