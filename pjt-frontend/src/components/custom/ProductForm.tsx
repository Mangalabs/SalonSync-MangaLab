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
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().default("Geral"),
  brand: z.string().optional(),
  salePrice: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    { message: "Preço de venda deve ser um número positivo" }
  ),
  costPrice: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    { message: "Preço de custo deve ser um número positivo" }
  ),
  currentStock: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    { message: "Quantidade deve ser um número positivo" }
  ),
  minStock: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    { message: "Estoque mínimo deve ser um número positivo" }
  ).default("0"),
  unit: z.string().default("un"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  brand?: string;
  salePrice: string;
  costPrice: string;
  currentStock: string;
  minStock: string;
  unit?: string;
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
      sku: initialData.sku || '',
      description: initialData.description || '',
      category: initialData.category || 'Geral',
      brand: initialData.brand || '',
      salePrice: typeof initialData.salePrice === 'string' ? initialData.salePrice : String(initialData.salePrice || '0'),
      costPrice: typeof initialData.costPrice === 'string' ? initialData.costPrice : String(initialData.costPrice || '0'),
      currentStock: typeof initialData.currentStock === 'string' ? initialData.currentStock : String(initialData.currentStock || '0'),
      minStock: typeof initialData.minStock === 'string' ? initialData.minStock : String(initialData.minStock || '0'),
      unit: initialData.unit || 'un'
    } : {
      category: 'Geral',
      salePrice: '0',
      costPrice: '0',
      currentStock: '0',
      minStock: '0',
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
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" {...register("sku")} />
      </div>
      
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register("category")} />
        </div>
        
        <div>
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" {...register("brand")} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
          <Input id="salePrice" {...register("salePrice")} type="number" step="0.01" min="0" />
          {errors.salePrice && (
            <p className="text-sm text-red-500">{errors.salePrice.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
          <Input id="costPrice" {...register("costPrice")} type="number" step="0.01" min="0" />
          {errors.costPrice && (
            <p className="text-sm text-red-500">{errors.costPrice.message}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="currentStock">Estoque Atual</Label>
          <Input id="currentStock" {...register("currentStock")} type="number" min="0" />
          {errors.currentStock && (
            <p className="text-sm text-red-500">{errors.currentStock.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="minStock">Estoque Mínimo</Label>
          <Input id="minStock" {...register("minStock")} type="number" min="0" />
          {errors.minStock && (
            <p className="text-sm text-red-500">{errors.minStock.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="unit">Unidade</Label>
          <Input id="unit" {...register("unit")} placeholder="un, kg, l, etc" />
        </div>
      </div>
      
      <Button type="submit" disabled={mutation.isPending}>
        {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar" : "Salvar")}
      </Button>
    </form>
  );
}