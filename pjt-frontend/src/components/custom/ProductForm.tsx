import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  brand: z.string().optional(),
  unit: z.string().default("un"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
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
      unit: initialData.unit || 'un'
    } : {
      category: 'Geral',
      unit: 'un'
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
        <p className="text-xs text-muted-foreground mt-1">
          Como o produto é medido (unidade, mililitros, gramas, etc.)
        </p>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-md">
        <p className="text-sm text-blue-700">
          💡 <strong>Dica:</strong> Após criar o produto, você poderá gerenciar o estoque na aba "Estoque" - 
          adicionar quantidades, definir estoque mínimo e acompanhar movimentações.
        </p>
      </div>
      
      <Button type="submit" disabled={mutation.isPending}>
        {isSubmitting ? "Salvando..." : "Criar Produto"}
      </Button>
    </form>
  );
}