import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

interface InventoryMovement {
  id: string;
  type: "ADD" | "REMOVE";
  quantity: number;
  reason: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
}

export function InventoryMovementTable() {
  const { activeBranch } = useBranch();

  const { data, isLoading, error } = useQuery<InventoryMovement[]>({
    queryKey: ["inventory-movements", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/inventory/movements");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  if (isLoading) return <p className="p-4">Carregando...</p>;
  if (error) return <p className="p-4 text-red-500">Erro ao carregar movimentações</p>;
  if (!data?.length) return <p className="p-4 text-gray-500">Nenhuma movimentação encontrada</p>;

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Data</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Produto</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tipo</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Quantidade</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Motivo</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Usuário</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((movement) => (
            <tr key={movement.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">
                {new Date(movement.createdAt).toLocaleString("pt-BR")}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{movement.product.name}</div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    movement.type === "ADD"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {movement.type === "ADD" ? "Entrada" : "Saída"}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {movement.quantity}
              </td>
              <td className="px-4 py-3 text-sm max-w-xs truncate">
                {movement.reason}
              </td>
              <td className="px-4 py-3 text-sm">
                {movement.user.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}