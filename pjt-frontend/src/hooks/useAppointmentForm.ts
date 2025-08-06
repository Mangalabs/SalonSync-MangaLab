import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

const createSchema = (isAdmin: boolean, isScheduled: boolean) => {
  const baseSchema = {
    professionalId: z.string().min(1, "Selecione um profissional"),
    clientId: z.string().min(1, "Selecione um cliente"),
    serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  };
  
  if (isScheduled) {
    return z.object({
      ...baseSchema,
      scheduledDate: z.string().min(1, "Data é obrigatória"),
      scheduledTime: z.string().min(1, "Horário é obrigatório"),
    });
  }
  
  return z.object(baseSchema);
};

export function useAppointmentForm(
  mode: "immediate" | "scheduled",
  professionals: { id: string; name: string }[],
  onSuccess: () => void
) {
  const queryClient = useQueryClient();
  const { user, isProfessional, isAdmin } = useUser();
  const isScheduled = mode === "scheduled";

  const form = useForm({
    resolver: zodResolver(createSchema(isAdmin, isScheduled)),
    defaultValues: isScheduled ? {
      professionalId: "", 
      clientId: "", 
      serviceIds: [],
      scheduledDate: "",
      scheduledTime: ""
    } : {
      professionalId: "", 
      clientId: "", 
      serviceIds: []
    },
  });

  // Auto-selecionar profissional se for funcionário (não admin)
  const currentProfessionalId = useMemo(() => {
    if (isProfessional && !isAdmin && user?.name && professionals.length > 0) {
      const currentProfessional = professionals.find(p => p.name === user.name);
      return currentProfessional?.id || "";
    }
    return "";
  }, [isProfessional, isAdmin, user?.name, professionals]);
  
  useEffect(() => {
    if (currentProfessionalId) {
      form.setValue('professionalId', currentProfessionalId);
    }
  }, [currentProfessionalId, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      let scheduledAt: string;
      let status: string;
      
      if (isScheduled && 'scheduledDate' in data && 'scheduledTime' in data) {
        scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString();
        status = "SCHEDULED";
      } else {
        scheduledAt = new Date().toISOString();
        status = "COMPLETED";
      }
      
      let finalProfessionalId = (isProfessional && !isAdmin) ? currentProfessionalId : data.professionalId;
      
      if (isProfessional && !isAdmin && !finalProfessionalId && user?.name) {
        const professional = professionals.find(p => p.name === user.name);
        finalProfessionalId = professional?.id || '';
      }
      
      const payload = {
        clientId: data.clientId,
        professionalId: finalProfessionalId,
        serviceIds: data.serviceIds,
        scheduledAt,
        status
      };
      
      await axios.post("/api/appointments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(isScheduled ? "Agendamento criado com sucesso!" : "Atendimento registrado com sucesso!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Erro ao ${isScheduled ? 'criar agendamento' : 'registrar atendimento'}`);
    },
  });

  return {
    form,
    mutation,
    currentProfessionalId,
  };
}