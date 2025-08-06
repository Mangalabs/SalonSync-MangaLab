import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  brand: z.string().optional(),
  costPrice: z.number().min(0, "Preço de custo deve ser maior ou igual a 0").optional(),
  salePrice: z.number().min(0, "Preço de venda deve ser maior ou igual a 0").optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  currentStock?: number;
}

export function ProductForm({ 
  onSuccess, 
  initialData 
}: { 
  onSuccess: () => void;
  initialData?: Product | null;
}) {
  const isEditing = !!initialData;
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      category: initialData.category || 'Geral',
      brand: initialData.brand || '',
      unit: initialData.unit || 'un',
      costPrice: initialData.costPrice || 0,
      salePrice: initialData.salePrice || 0
    } : {
      category: 'Geral',
      unit: 'un',
      costPrice: 0,
      salePrice: 0
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (isEditing) {
        return axios.patch(`/api/products/${initialData.id}`, data);
      } else {
        return axios.post("/api/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", activeBranch?.id] });
      toast.success(isEditing ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
      reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} produto`);
    
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Produto</Label>
        <Input id="name" {...register("name")} placeholder="Ex: Shampoo Anticaspa" />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register("category")} placeholder="Ex: Cabelo, Barba, Pele" />
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" {...register("brand")} placeholder="Ex: L'Oréal, Pantene" />
        </div>
      </div>
      
      <div>
        <Label htmlFor="unit">Unidade</Label>
        <Input id="unit" {...register("unit")} placeholder="un, ml, g, kg, l" />
        <p className="text-xs text-[#737373] mt-1">
          Como o produto é medido (unidade, mililitros, gramas, etc.)
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
          <Input 
            id="costPrice" 
            type="number" 
            step="0.01" 
            min="0"
            {...register("costPrice", { valueAsNumber: true })} 
            placeholder="0,00" 
          />
          {errors.costPrice && (
            <p className="text-sm text-red-500">{errors.costPrice.message}</p>
          )}
          <p className="text-xs text-[#737373] mt-1">
            Quanto você paga pelo produto
          </p>
        </div>
        
        <div>
          <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
          <Input 
            id="salePrice" 
            type="number" 
            step="0.01" 
            min="0"
            {...register("salePrice", { valueAsNumber: true })} 
            placeholder="0,00" 
          />
          {errors.salePrice && (
            <p className="text-sm text-red-500">{errors.salePrice.message}</p>
          )}
          <p className="text-xs text-[#737373] mt-1">
            Preço usado nas vendas
          </p>
        </div>
      </div>
      
      <div className="bg-[#D4AF37]/10 p-3 rounded-md border border-[#D4AF37]/20">
        <p className="text-sm text-[#8B4513]">
          💡 <strong>Dica:</strong> O preço de venda será usado automaticamente nas vendas. 
          Você pode alterá-lo a qualquer momento editando o produto.
        </p>
      </div>
      
      <Button type="submit" disabled={mutation.isPending}>
        {isSubmitting ? "Salvando..." : "Criar Produto"}
      </Button>
    </form>
  );
}