import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";

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
  const { data: rawData = [], isLoading } = useQuery<RawAppointment[]>({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await axios.get("/api/appointments");
      return Array.isArray(res.data) ? res.data : [];
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

  if (isLoading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="border rounded-md divide-y">
      {data.map((appt) => (
        <div key={appt.id} className="p-4 space-y-1">
          <div className="text-sm text-muted-foreground">
            {new Date(appt.createdAt).toLocaleString()}
          </div>
          <div className="font-semibold">
            Profissional: {appt.professional.name}
          </div>
          <div className="font-semibold">Cliente: {appt.client.name}</div>
          <div className="text-sm">Serviços:</div>
          <ul className="list-disc list-inside text-sm">
            {appt.appointmentServices.map((as) => (
              <li key={as.service.id}>
                {as.service.name} – R$ {as.service.price.toFixed(2)}
              </li>
            ))}
          </ul>
          <div className="font-semibold">Total: R$ {appt.total.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}
