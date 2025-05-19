import { useQuery } from "@tanstack/react-query";

type Professional = {
  id: string;
  name: string;
  role: string;
};

export function ProfessionalTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const res = await fetch("http://localhost:3000/api/professionals");

      return res.json();
    },
  });

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div className="border rounded-md p-4 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Nome</th>
            <th className="py-2">Função</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((prof: Professional) => (
            <tr key={prof.id} className="border-t">
              <td className="py-2">{prof.name}</td>
              <td className="py-2">{prof.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
