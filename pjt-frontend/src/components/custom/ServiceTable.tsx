import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function ServiceTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/services");
      return res.data;
    },
  });

  if (isLoading) return <p>Carregando serviços...</p>;
  if (!Array.isArray(data)) return <p>Nenhum serviço encontrado.</p>;

  return (
    <div className="border rounded-md p-4 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Nome</th>
            <th className="py-2">Preço</th>
          </tr>
        </thead>
        <tbody>
          {data.map((service: any) => (
            <tr key={service.id} className="border-t">
              <td className="py-2">{service.name}</td>
              <td className="py-2">R$ {Number(service.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
