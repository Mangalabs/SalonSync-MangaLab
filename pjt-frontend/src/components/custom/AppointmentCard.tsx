import { Button } from "@/components/ui/button";
import { Calendar, User, DollarSign, X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";


interface Appointment {
  id: string;
  scheduledAt: string;
  status?: string;
  professional: { name: string };
  client: { name: string };
  appointmentServices: {
    service: { name: string; price: string };
  }[];
  total: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  mode?: "scheduled" | "completed";
}

export function AppointmentCard({ appointment, mode }: AppointmentCardProps) {
  const queryClient = useQueryClient();
  
  const aptDate = new Date(appointment.scheduledAt);
  const now = new Date();
  const isPast = aptDate <= now;
  const isCompleted = appointment.status === "COMPLETED";

  const cancelAppointment = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const confirmAppointment = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return (
    <div
      className={`border rounded-lg p-3 md:p-4 ${
        isCompleted
          ? "bg-[#D4AF37]/10 border-[#D4AF37]/20"
          : isPast
          ? "bg-[#F0F0EB] border-muted-foreground/20"
          : "bg-white"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium text-sm sm:text-base">
            {aptDate.toLocaleDateString("pt-BR")} às{" "}
            {aptDate.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          <span className="font-semibold text-sm sm:text-base">
            R$ {Number(appointment.total).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4" />
        <span className="font-medium text-sm sm:text-base">
          {appointment.client.name}
        </span>
      </div>

      <div className="text-xs sm:text-sm text-[#737373] mb-2">
        <strong>Profissional:</strong> {appointment.professional.name}
      </div>

      <div className="text-xs sm:text-sm text-[#737373] mb-3">
        <strong>Serviços:</strong>{" "}
        {appointment.appointmentServices
          .map((as) => as.service.name)
          .join(", ")}
      </div>

      {mode === "scheduled" && !isCompleted && (
        <div className="flex flex-col sm:flex-row gap-2">
          {isPast ? (
            <>
              <Button
                size="sm"
                onClick={() => confirmAppointment.mutate()}
                disabled={confirmAppointment.isPending}
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A]"
              >
                <Check size={14} className="mr-1" />
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => cancelAppointment.mutate()}
                disabled={cancelAppointment.isPending}
              >
                <X size={14} className="mr-1" />
                Não Compareceu
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelAppointment.mutate()}
              disabled={cancelAppointment.isPending}
              className="w-full text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2]"
            >
              <X size={14} className="mr-1" />
              Cancelar Agendamento
            </Button>
          )}
        </div>
      )}
    </div>
  );
}