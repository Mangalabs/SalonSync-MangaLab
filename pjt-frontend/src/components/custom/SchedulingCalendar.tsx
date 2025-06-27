import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, DollarSign } from "lucide-react";

interface Appointment {
  id: string;
  scheduledAt: string;
  professional: { name: string };
  client: { name: string };
  appointmentServices: {
    service: { name: string; price: string };
  }[];
  total: string;
}

export function SchedulingCalendar() {
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await axios.get("/api/appointments");
      return res.data;
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (apt) => apt.scheduledAt.split("T")[0] === today
  );

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.scheduledAt) > new Date())
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
    .slice(0, 5);

  if (isLoading) return <div>Carregando agendamentos...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atendimentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum agendamento para hoje
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        {new Date(apt.scheduledAt).toLocaleTimeString("pt-BR", {
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
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4" />
                    <span>{apt.client.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-muted-foreground">Nenhum agendamento futuro</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {new Date(apt.scheduledAt).toLocaleDateString("pt-BR")}{" "}
                        às{" "}
                        {new Date(apt.scheduledAt).toLocaleTimeString("pt-BR", {
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
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4" />
                    <span>{apt.client.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
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
  );
}
