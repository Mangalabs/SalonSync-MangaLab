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
import { Trash2, Edit } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { AdjustmentStockForm } from "./AdjustmentStockForm";
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
  salePrice: number;
  costPrice: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  isActive: boolean;
}

export function ProductTable() {
  const queryClient = useQueryClient();

  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
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

  const handleAdjustment = (product: Product) => {
    setAdjustingProduct(product);
  };

  if (isLoading) return <p className="p-4">Carregando...</p>;
  if (error) return <p className="p-4 text-red-500">Erro ao carregar produtos</p>;
  if (!data?.length) return <p className="p-4 text-gray-500">Nenhum produto encontrado</p>;

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5F5F0]">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-[#1A1A1A]">Produto</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-[#1A1A1A]">Categoria</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-[#1A1A1A]">Preço Custo</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-[#1A1A1A]">Preço Venda</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-[#1A1A1A]">Estoque</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-[#1A1A1A]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#1A1A1A]">{product.name}</div>
                  <div className="text-xs text-[#737373]">
                    {product.brand && `${product.brand} • `}{product.unit}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#737373]">{product.category || "-"}</td>
                <td className="px-4 py-3 text-right text-sm">
                  {product.costPrice > 0 ? (
                    <span className="text-red-600 font-medium">
                      R$ {Number(product.costPrice).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#737373]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {product.salePrice > 0 ? (
                    <span className="text-[#D4AF37] font-medium">
                      R$ {Number(product.salePrice).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#737373]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${
                    product.currentStock <= (product.minStock || 0) 
                      ? 'text-red-600' 
                      : 'text-[#1A1A1A]'
                  }`}>
                    {product.currentStock}
                  </span>
                  <span className="text-xs text-[#737373] ml-1">{product.unit}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustment(product)}
                      title="Ajustar estoque"
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data?.map((product) => (
          <div key={product.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-[#1A1A1A]">{product.name}</h3>
                <p className="text-xs text-[#737373]">
                  {product.category} • {product.brand && `${product.brand} • `}{product.unit}
                </p>
              </div>
              <span className={`font-medium text-sm ${
                product.currentStock <= (product.minStock || 0) 
                  ? 'text-red-600' 
                  : 'text-[#1A1A1A]'
              }`}>
                {product.currentStock} {product.unit}
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm">
                {product.salePrice > 0 && (
                  <span className="text-[#D4AF37] font-medium">
                    R$ {Number(product.salePrice).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdjustment(product)}
                className="text-xs flex-1"
              >
                <Edit size={12} className="mr-1" />
                Ajustar Estoque
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeletingProductId(product.id)}
                disabled={deleteProduct.isPending}
                className="text-xs"
              >
                <Trash2 size={12} className="mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!adjustingProduct}
        onOpenChange={() => setAdjustingProduct(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto - {adjustingProduct?.name}</DialogTitle>
          </DialogHeader>
          <AdjustmentStockForm
            product={adjustingProduct}
            onSuccess={() => setAdjustingProduct(null)}
          />
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