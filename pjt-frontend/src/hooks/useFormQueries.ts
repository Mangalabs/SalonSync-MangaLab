import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

export function useFormQueries(selectedProfessional?: string, selectedDate?: string, isScheduled?: boolean) {
  const { activeBranch } = useBranch();

  const professionals = useQuery<{ id: string; name: string }[]>({
    queryKey: ["professionals", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const clients = useQuery<{ id: string; name: string }[]>({
    queryKey: ["clients", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/clients");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const services = useQuery<{ id: string; name: string; price: number }[]>({
    queryKey: ["services", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/services");
      return res.data as any[];
    },
    select: (raw) =>
      (raw as any[]).map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
      })),
    enabled: !!activeBranch,
  });
  
  const availableSlots = useQuery({
    queryKey: ["available-slots", selectedProfessional, selectedDate],
    queryFn: async () => {
      const res = await axios.get(`/api/appointments/available-slots/${selectedProfessional}/${selectedDate}`);
      return res.data;
    },
    enabled: isScheduled && !!selectedProfessional && !!selectedDate,
  });

  return {
    professionals: professionals.data || [],
    clients: clients.data || [],
    services: services.data || [],
    availableSlots: availableSlots.data || [],
    isLoading: professionals.isLoading || clients.isLoading || services.isLoading,
  };
}