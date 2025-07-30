import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  DollarSign,
  X,
  Check,
  CheckSquare,
} from "lucide-react";
import { useBranch } from "@/contexts/BranchContext";
import { ProfessionalCommissionSummary } from "./ProfessionalCommissionSummary";
import { ProfessionalCommissionCard } from "./ProfessionalCommissionCard";
import { useUser } from "@/contexts/UserContext";

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

interface SchedulingCalendarProps {
  mode?: "scheduled" | "completed";
  searchTerm?: string;
  statusFilter?: string;
  dateFilter?: string;
  professionalFilter?: string;
}

export function SchedulingCalendar({
  mode,
  searchTerm = "",
  statusFilter = "all",
  dateFilter = "all",
  professionalFilter = "all",
}: SchedulingCalendarProps) {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const { isAdmin } = useUser();

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

  // Filtrar por modo
  let filteredAppointments =
    mode === "completed"
      ? appointments.filter((apt) => apt.status === "COMPLETED")
      : appointments.filter((apt) => apt.status === "SCHEDULED");

  // Aplicar filtros apenas quando mode está definido
  if (mode) {
    // Filtro de busca
    if (searchTerm) {
      filteredAppointments = filteredAppointments.filter(
        (apt) =>
          apt.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.professional.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status (apenas para agendamentos)
    if (mode === "scheduled" && statusFilter !== "all") {
      const now = new Date();
      if (statusFilter === "overdue") {
        filteredAppointments = filteredAppointments.filter(
          (apt) => new Date(apt.scheduledAt) < now
        );
      }
    }

    // Filtro de data
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filteredAppointments = filteredAppointments.filter((apt) => {
        const aptDate = new Date(apt.scheduledAt);

        switch (dateFilter) {
          case "today":
            return aptDate.toDateString() === today.toDateString();
          case "week":
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return aptDate >= weekStart && aptDate <= weekEnd;
          case "month":
            return (
              aptDate.getMonth() === today.getMonth() &&
              aptDate.getFullYear() === today.getFullYear()
            );
          case "last-month":
            const lastMonth = new Date(
              today.getFullYear(),
              today.getMonth() - 1,
              1
            );
            const lastMonthEnd = new Date(
              today.getFullYear(),
              today.getMonth(),
              0
            );
            return aptDate >= lastMonth && aptDate <= lastMonthEnd;
          default:
            return true;
        }
      });
    }

    // Filtro de profissional
    if (professionalFilter !== "all") {
      filteredAppointments = filteredAppointments.filter(
        (apt) => apt.professional.name === professionalFilter
      );
    }
  }

  const sortedAppointments = filteredAppointments.sort(
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

  if (isLoading) return <div>Carregando...</div>;

  // Se mode está definido, mostrar apenas a lista
  if (mode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {mode === "completed" ? "Atendimentos Realizados" : "Agendamentos"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAppointments.length === 0 ? (
            <p className="text-[#737373]">
              {mode === "completed"
                ? "Nenhum atendimento realizado"
                : "Nenhum agendamento"}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((apt) => {
                const aptDate = new Date(apt.scheduledAt);
                const now = new Date();
                const isPast = aptDate <= now;
                const isCompleted = apt.status === "COMPLETED";

                return (
                  <div
                    key={apt.id}
                    className={`border rounded-lg p-4 ${
                      isCompleted
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]/20"
                        : isPast
                        ? "bg-[#F0F0EB] border-muted-foreground/20"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
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
                      <span className="font-medium">{apt.client.name}</span>
                    </div>

                    <div className="text-sm text-[#737373] mb-2">
                      <strong>Profissional:</strong> {apt.professional.name}
                    </div>

                    <div className="text-sm text-[#737373] mb-3">
                      <strong>Serviços:</strong>{" "}
                      {apt.appointmentServices
                        .map((as) => as.service.name)
                        .join(", ")}
                    </div>

                    {mode === "scheduled" && !isCompleted && (
                      <div className="flex gap-2">
                        {isPast ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => confirmAppointment.mutate(apt.id)}
                              disabled={confirmAppointment.isPending}
                              className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A]"
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
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelAppointment.mutate(apt.id)}
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
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#D4AF37]">
              R$ {todayRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-[#737373]">
              {todayCompletedAppointments.length} atendimentos hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <Calendar className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#D4AF37]">
              R$ {monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-[#737373]">
              {new Date().toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>

        {isAdmin ? (
          <ProfessionalCommissionSummary />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Minha Performance
              </CardTitle>
              <User className="h-4 w-4 text-[#737373]" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">Olá, Profissional!</div>
              <p className="text-xs text-[#737373]">
                Acompanhe suas comissões abaixo
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {!isAdmin && <ProfessionalCommissionCard />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.filter((apt) => apt.status === "SCHEDULED").length ===
            0 ? (
              <p className="text-[#737373]">Nenhum agendamento</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {appointments
                  .filter((apt) => apt.status === "SCHEDULED")
                  .map((apt) => {
                    const aptDate = new Date(apt.scheduledAt);
                    const now = new Date();
                    const isPast = aptDate <= now;

                    return (
                      <div
                        key={apt.id}
                        className={`border rounded-lg p-3 ${
                          isPast ? "bg-[#F0F0EB]" : "bg-white"
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
                        <div className="text-sm text-[#737373] mb-2">
                          {apt.professional.name}
                        </div>
                        <div className="text-sm text-[#737373] mb-3">
                          {apt.appointmentServices
                            .map((as) => as.service.name)
                            .join(", ")}
                        </div>

                        {!isAdmin && isPast && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => confirmAppointment.mutate(apt.id)}
                              disabled={confirmAppointment.isPending}
                              className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A]"
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
                        )}
                        {!isAdmin && !isPast && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelAppointment.mutate(apt.id)}
                            disabled={cancelAppointment.isPending}
                            className="w-full text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2]"
                          >
                            <X size={14} className="mr-1" />
                            Cancelar Agendamento
                          </Button>
                        )}
                        {isAdmin && (
                          <div className="text-xs text-[#737373] mt-2">
                            Status:{" "}
                            {isPast ? "Aguardando confirmação" : "Agendado"}
                          </div>
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
              <CheckSquare className="h-5 w-5" />
              Atendimentos Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayCompletedAppointments.length === 0 ? (
              <p className="text-[#737373]">Nenhum atendimento hoje</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayCompletedAppointments.map((apt) => {
                  const aptDate = new Date(apt.scheduledAt);

                  return (
                    <div
                      key={apt.id}
                      className="border rounded-lg p-3 bg-[#D4AF37]/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-[#D4AF37]" />
                          <span className="font-medium">
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
                      <div className="text-sm text-[#737373]">
                        {apt.professional.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
