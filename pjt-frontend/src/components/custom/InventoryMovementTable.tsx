import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

interface InventoryMovement {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "LOSS";
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  reference?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
  };
  user?: {
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
        <thead className="bg-[#F5F5F0]">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-[#1A1A1A]">Data</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-[#1A1A1A]">Produto</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-[#1A1A1A]">Tipo</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-[#1A1A1A]">Qtd</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-[#1A1A1A]">Valor Unit.</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-[#1A1A1A]">Total</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-[#1A1A1A]">Motivo</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-[#1A1A1A]">Referência</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-[#1A1A1A]">Usuário</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((movement) => {
            const getTypeConfig = (type: string) => {
              switch (type) {
                case "IN":
                  return { label: "Entrada", color: "bg-green-100 text-green-800" };
                case "OUT":
                  return { label: "Saída", color: "bg-red-100 text-red-800" };
                case "ADJUSTMENT":
                  return { label: "Ajuste", color: "bg-blue-100 text-blue-800" };
                case "LOSS":
                  return { label: "Perda", color: "bg-orange-100 text-orange-800" };
                default:
                  return { label: type, color: "bg-gray-100 text-gray-800" };
              }
            };
            
            const typeConfig = getTypeConfig(movement.type);
            
            return (
              <tr key={movement.id} className="hover:bg-[#F5F5F0]/50">
                <td className="px-4 py-3 text-sm">
                  {new Date(movement.createdAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[#1A1A1A]">{movement.product.name}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                    {typeConfig.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {movement.quantity}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {movement.unitCost ? (
                    <span className="text-[#D4AF37] font-medium">
                      R$ {Number(movement.unitCost).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#737373]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {movement.totalCost ? (
                    <span className="text-[#D4AF37] font-semibold">
                      R$ {Number(movement.totalCost).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#737373]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm max-w-xs truncate text-[#737373]">
                  {movement.reason}
                </td>
                <td className="px-4 py-3 text-sm text-[#737373]">
                  {movement.reference || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-[#737373]">
                  {movement.user?.name || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}