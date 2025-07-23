import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, DollarSign, X, Check } from "lucide-react";
import { useBranch } from "@/contexts/BranchContext";
import { ProfessionalCommissionSummary } from "./ProfessionalCommissionSummary";

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

export function SchedulingCalendar() {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/appointments");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const confirmAppointment = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/appointments/${id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const allScheduledAppointments = appointments
    .filter((apt) => apt.status === "SCHEDULED")
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

  const todayCompletedAppointments = appointments.filter((apt) => {
    const today = new Date().toISOString().split("T")[0];
    return (
      apt.status === "COMPLETED" && apt.scheduledAt.split("T")[0] === today
    );
  });

  const todayRevenue = todayCompletedAppointments.reduce(
    (sum, apt) => sum + Number(apt.total),
    0
  );
  const monthlyRevenue = appointments
    .filter((apt) => {
      const today = new Date();
      const aptDate = new Date(apt.scheduledAt);
      return (
        apt.status === "COMPLETED" &&
        aptDate.getMonth() === today.getMonth() &&
        aptDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, apt) => sum + Number(apt.total), 0);

  const professionalStats = appointments
    .filter((apt) => apt.status === "COMPLETED")
    .reduce((acc, apt) => {
      const name = apt.professional.name;
      if (!acc[name]) acc[name] = { count: 0, revenue: 0 };
      acc[name].count++;
      acc[name].revenue += Number(apt.total);
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

  const topProfessional = Object.entries(professionalStats).sort(
    ([, a], [, b]) => b.count - a.count
  )[0];

  if (isLoading) return <div>Carregando agendamentos...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {todayRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayCompletedAppointments.length} atendimentos hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>

        <ProfessionalCommissionSummary />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allScheduledAppointments.length === 0 ? (
              <p className="text-muted-foreground">Nenhum agendamento</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allScheduledAppointments.map((apt) => {
                  const aptDate = new Date(apt.scheduledAt);
                  const now = new Date();
                  const isPast = aptDate <= now;

                  return (
                    <div
                      key={apt.id}
                      className={`border rounded-lg p-3 ${
                        isPast ? "bg-yellow-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {aptDate.toLocaleDateString("pt-BR")} às{" "}
                            {aptDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">
                            R$ {Number(apt.total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span>{apt.client.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {apt.professional.name}
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {apt.appointmentServices
                          .map((as) => as.service.name)
                          .join(", ")}
                      </div>

                      {isPast ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => confirmAppointment.mutate(apt.id)}
                            disabled={confirmAppointment.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <Check size={14} className="mr-1" />
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cancelAppointment.mutate(apt.id)}
                            disabled={cancelAppointment.isPending}
                            className="flex-1"
                          >
                            <X size={14} className="mr-1" />
                            Não Compareceu
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelAppointment.mutate(apt.id)}
                          disabled={cancelAppointment.isPending}
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X size={14} className="mr-1" />
                          Cancelar Agendamento
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atendimentos do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayCompletedAppointments.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum atendimento realizado hoje
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayCompletedAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="border rounded-lg p-3 bg-green-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {new Date(apt.scheduledAt).toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">
                          R$ {Number(apt.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span>{apt.client.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {apt.professional.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {apt.appointmentServices
                        .map((as) => as.service.name)
                        .join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
