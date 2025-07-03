import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, User, Calendar, DollarSign, ChevronDown, ChevronRight, Filter } from "lucide-react";

interface RawAppointment {
  id: string;
  professional: { name: string };
  client: { name: string };
  appointmentServices: {
    service: { id: string; name: string; price: string };
  }[];
  total: string;
  createdAt: string;
}

export function AppointmentTable() {
  const queryClient = useQueryClient();
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  
  const { data: rawData = [], isLoading } = useQuery<RawAppointment[]>({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await axios.get("/api/appointments");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await axios.get("/api/clients");
      return res.data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await axios.get("/api/services");
      return res.data;
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao excluir agendamento');
    },
  });

  const data = useMemo(
    () =>
      rawData.map((appt) => ({
        ...appt,
        total: Number(appt.total),
        appointmentServices: appt.appointmentServices.map((as) => ({
          ...as,
          service: {
            ...as.service,
            price: Number(as.service.price),
          },
        })),
      })),
    [rawData]
  );

  const completedAppointments = data.filter(
    apt => !apt.status || apt.status === 'COMPLETED'
  );


  const filteredAppointments = useMemo(() => {
    let filtered = completedAppointments;

    if (selectedProfessional !== "all") {
      filtered = filtered.filter(apt => apt.professional.name === selectedProfessional);
    }

    if (selectedClient !== "all") {
      filtered = filtered.filter(apt => apt.client.name === selectedClient);
    }

    if (selectedService !== "all") {
      filtered = filtered.filter(apt => 
        apt.appointmentServices.some(as => as.service.name === selectedService)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(apt => 
        apt.scheduledAt.split('T')[0] === dateFilter
      );
    }

    return filtered;
  }, [completedAppointments, selectedProfessional, selectedClient, selectedService, dateFilter]);


  const groupedData = useMemo(() => {
    return filteredAppointments.reduce((acc, apt) => {
      const professionalName = apt.professional.name;
      const date = new Date(apt.scheduledAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });

      if (!acc[professionalName]) {
        acc[professionalName] = { months: {} };
      }

      if (!acc[professionalName].months[monthKey]) {
        acc[professionalName].months[monthKey] = {
          name: monthName,
          appointments: [],
          total: 0
        };
      }

      acc[professionalName].months[monthKey].appointments.push(apt);
      acc[professionalName].months[monthKey].total += apt.total;

      return acc;
    }, {} as Record<string, { months: Record<string, { name: string; appointments: any[]; total: number }> }>);
  }, [filteredAppointments]);

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  if (isLoading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Atendimentos Realizados</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Data</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filtrar por data"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Profissional</label>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {professionals.map((prof: any) => (
                  <SelectItem key={prof.id} value={prof.name}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Cliente</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.name}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Serviço</label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {services.map((service: any) => (
                  <SelectItem key={service.id} value={service.name}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {(selectedProfessional !== "all" || selectedClient !== "all" || selectedService !== "all" || dateFilter) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedProfessional("all");
              setSelectedClient("all");
              setSelectedService("all");
              setDateFilter("");
            }}
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {Object.keys(groupedData).length === 0 ? (
        <div className="border rounded-lg p-6 text-center text-muted-foreground">
          {dateFilter || selectedProfessional !== "all" || selectedClient !== "all" || selectedService !== "all" 
            ? "Nenhum atendimento encontrado com os filtros aplicados."
            : "Nenhum atendimento realizado encontrado."
          }
        </div>
      ) : (
        Object.entries(groupedData).map(([professionalName, professionalData]) => (
        <div key={professionalName} className="border rounded-lg">
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <h4 className="font-semibold">{professionalName}</h4>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(professionalData.months)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([monthKey, monthData]) => (
                <div key={monthKey} className="border rounded-lg">
                  <Button
                    variant="ghost"
                    onClick={() => toggleMonth(`${professionalName}-${monthKey}`)}
                    className="w-full justify-between p-4 h-auto"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{monthData.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({monthData.appointments.length} atendimentos)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">R$ {monthData.total.toFixed(2)}</span>
                      </div>
                      {expandedMonths.has(`${professionalName}-${monthKey}`) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </Button>

                  {expandedMonths.has(`${professionalName}-${monthKey}`) && (
                    <div className="border-t p-4 space-y-3">
                      {monthData.appointments.map((apt) => (
                        <div key={apt.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium">
                              {new Date(apt.scheduledAt).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">R$ {apt.total.toFixed(2)}</span>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteAppointment.mutate(apt.id)}
                                disabled={deleteAppointment.isPending}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm mb-1">
                            <strong>Cliente:</strong> {apt.client.name}
                          </div>
                          <div className="text-sm">
                            <strong>Serviços:</strong>{' '}
                            {apt.appointmentServices.map(as => as.service.name).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
        ))
      )}
    </div>
  );
}
