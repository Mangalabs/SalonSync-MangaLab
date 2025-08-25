import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StockMovementForm } from "./StockMovementForm";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [editingMovement, setEditingMovement] = useState<InventoryMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<InventoryMovement | null>(null);

  const deleteMovement = useMutation({
    mutationFn: async (movementId: string) => {
      await axios.delete(`/api/inventory/movements/${movementId}`);
    },
    onSuccess: () => {
      toast.success("Movimentação excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeletingMovement(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao excluir movimentação");
    },
  });

  const { data, isLoading, error } = useQuery<InventoryMovement[]>({
    queryKey: ["inventory-movements", activeBranch?.id],
    queryFn: async () => {
      console.log('📈 Fetching inventory movements for branch:', activeBranch?.id);
      const params = activeBranch?.id ? `?branchId=${activeBranch.id}` : '';
      const res = await axios.get(`/api/inventory/movements${params}`);
      console.log('📈 Inventory movements response:', res.data);
      return res.data;
    },
    enabled: !!activeBranch,
  });

  if (isLoading) return <p className="p-4">Carregando...</p>;
  if (error) return <p className="p-4 text-red-500">Erro ao carregar movimentações</p>;
  if (!data?.length) return (
    <div className="text-center py-8">
      <p className="text-gray-500">Nenhuma movimentação encontrada</p>
    </div>
  );

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

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block border rounded-md overflow-hidden">
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
              <th className="px-4 py-2 text-center text-sm font-medium text-[#1A1A1A]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((movement) => {
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
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMovement(movement)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingMovement(movement)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data?.map((movement) => {
          const typeConfig = getTypeConfig(movement.type);
          
          return (
            <div key={movement.id} className="bg-white border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-[#1A1A1A] truncate">{movement.product.name}</h3>
                  <p className="text-xs text-[#737373]">
                    {new Date(movement.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color} ml-2`}>
                  {typeConfig.label}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-center">
                  <div className="text-sm font-medium">{movement.quantity}</div>
                  <div className="text-xs text-[#737373]">Quantidade</div>
                </div>
                
                {movement.totalCost && (
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#D4AF37]">
                      R$ {Number(movement.totalCost).toFixed(2)}
                    </div>
                    <div className="text-xs text-[#737373]">Total</div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-[#737373] mb-1">
                <strong>Motivo:</strong> <span className="break-words">{movement.reason.length > 50 ? `${movement.reason.substring(0, 50)}...` : movement.reason}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs text-[#737373] mb-2">
                <div className="flex gap-4">
                  {movement.reference && (
                    <span><strong>Ref:</strong> {movement.reference}</span>
                  )}
                  {movement.user?.name && (
                    <span><strong>Por:</strong> {movement.user.name}</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMovement(movement)}
                  className="flex-1"
                >
                  <Edit size={12} className="mr-1" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeletingMovement(movement)}
                  className="flex-1"
                >
                  <Trash2 size={12} className="mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Dialog de Edição */}
      <Dialog open={!!editingMovement} onOpenChange={() => setEditingMovement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          {editingMovement && (
            <StockMovementForm
              initialData={editingMovement}
              onSuccess={() => setEditingMovement(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Exclusão */}
      <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita e irá afetar o estoque do produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMovement && deleteMovement.mutate(deletingMovement.id)}
              disabled={deleteMovement.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}