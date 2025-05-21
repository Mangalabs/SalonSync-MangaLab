import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export function ClientTable() {
  const { data, isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await axios.get("/api/clients");
      return res.data;
    },
  });

  if (isLoading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="border rounded-md divide-y">
      {data?.map((client) => (
        <div key={client.id} className="p-4 space-y-1">
          <div className="font-semibold text-lg">{client.name}</div>
          {client.phone && <div className="text-sm">Tel: {client.phone}</div>}
          {client.email && <div className="text-sm">Email: {client.email}</div>}
        </div>
      ))}
    </div>
  );
}
