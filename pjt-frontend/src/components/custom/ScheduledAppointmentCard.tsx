import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";
import { toast } from "sonner";

interface ScheduledAppointment {
  id: string;
  professional: { name: string };
  client: { name: string };
  appointmentServices: {
    service: { name: string; price: string };
  }[];
  total: string;
  scheduledAt: string;
  status: string;
}

export function ScheduledAppointmentCard({ appointment }: { appointment: ScheduledAppointment }) {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", activeBranch?.id] });
      toast.success("Agendamento confirmado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao confirmar agendamento");
    
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", activeBranch?.id] });
      toast.success("Agendamento cancelado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao cancelar agendamento");
    
    },
  });

  const appointmentDate = new Date(appointment.scheduledAt);
  const today = new Date();
  const isToday = appointmentDate.toDateString() === today.toDateString();
  const isPast = appointmentDate < today;

  return (
    <div className={`border rounded-lg shadow-sm ${
      isPast ? 'border-red-200 bg-red-50' : isToday ? 'border-blue-200 bg-blue-50' : 'bg-white'
    }`}>
      <div className="p-4 pb-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            {appointment.client.name}
          </h3>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isPast ? 'bg-red-100 text-red-800' : 
            isToday ? 'bg-blue-100 text-blue-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {isPast ? "Atrasado" : isToday ? "Hoje" : "Agendado"}
          </span>
        </div>
      </div>
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{appointmentDate.toLocaleDateString('pt-BR')}</span>
          <Clock className="h-4 w-4 ml-2" />
          <span>{appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="text-sm">
          <strong>Profissional:</strong> {appointment.professional.name}
        </div>

        <div className="text-sm">
          <strong>Serviços:</strong>
          <ul className="mt-1 space-y-1">
            {appointment.appointmentServices.map((as, index) => (
              <li key={index} className="flex justify-between">
                <span>• {as.service.name}</span>
                <span>R$ {Number(as.service.price).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>R$ {Number(appointment.total).toFixed(2)}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            {(isToday || isPast) && (
              <Button
                size="sm"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}