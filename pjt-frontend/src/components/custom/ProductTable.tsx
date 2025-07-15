import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Trash2, Edit, Plus, Minus } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { InventoryAdjustmentForm } from "./InventoryAdjustmentForm";
import { useState } from "react";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category: string;
  brand?: string;
  salePrice: string;
  costPrice: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  isActive: boolean;
}

export function ProductTable() {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove" | null>(null);
  const { activeBranch } = useBranch();

  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ["products", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/products");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", activeBranch?.id] });
      setDeletingProductId(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erro ao excluir produto");
      setDeletingProductId(null);
    },
  });

  const handleAdjustment = (product: Product, type: "add" | "remove") => {
    setAdjustingProduct(product);
    setAdjustmentType(type);
  };

  if (isLoading) return <p className="p-4">Carregando...</p>;
  if (error) return <p className="p-4 text-red-500">Erro ao carregar produtos</p>;
  if (!data?.length) return <p className="p-4 text-gray-500">Nenhum produto encontrado</p>;

  return (
    <div>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Nome</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">SKU</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Preço</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Custo</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Estoque</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{product.name}</div>
                  {product.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {product.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{product.sku || "-"}</td>
                <td className="px-4 py-3 text-right">
                  R$ {Number(product.salePrice).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  R$ {Number(product.costPrice).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {product.currentStock} {product.unit}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustment(product, "add")}
                      title="Adicionar ao estoque"
                    >
                      <Plus size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustment(product, "remove")}
                      title="Remover do estoque"
                    >
                      <Minus size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingProductId(product.id)}
                      disabled={deleteProduct.isPending}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!editingProduct}
        onOpenChange={() => setEditingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={editingProduct}
            onSuccess={() => setEditingProduct(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!adjustingProduct && adjustmentType !== null}
        onOpenChange={() => {
          setAdjustingProduct(null);
          setAdjustmentType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === "add" ? "Adicionar ao Estoque" : "Remover do Estoque"}
            </DialogTitle>
          </DialogHeader>
          {adjustingProduct && (
            <InventoryAdjustmentForm
              product={adjustingProduct}
              type={adjustmentType as "add" | "remove"}
              onSuccess={() => {
                setAdjustingProduct(null);
                setAdjustmentType(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingProductId}
        onOpenChange={() => setDeletingProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProductId && deleteProduct.mutate(deletingProductId)}
              disabled={deleteProduct.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}