import { useForm } from "react-hook-form";
import { useMemo, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import { useBranch } from "@/contexts/BranchContext";

import { ShoppingCart } from "lucide-react";

const saleSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  unitPrice: z.number().min(0.01, "Preço deve ser maior que 0"),
  clientId: z.string().optional(),
  notes: z.string().optional(),
  soldById: z.string().optional(),
  branchId: z.string().min(1, "Selecione uma filial"),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface ProductSaleFormProps {
  onSuccess: () => void;
}

export function ProductSaleForm({ onSuccess }: ProductSaleFormProps) {
  const queryClient = useQueryClient();
  const { user, isAdmin, isProfessional } = useUser();
  const { activeBranch } = useBranch();

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await axios.get("/api/branches");
      return res.data;
    },
    enabled: isAdmin,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      branchId: !isAdmin ? activeBranch?.id : undefined,
    },
  });

  const selectedBranchId = watch("branchId");
  
  // Log para debug da seleção de filial
  useEffect(() => {
    console.log("🏢 ProductSaleForm: selectedBranchId changed to:", selectedBranchId);
  }, [selectedBranchId]);

  const { data: products = [] } = useQuery({
    queryKey: ["products", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      console.log("📝 ProductSaleForm: Loading products for branch:", selectedBranchId);
      const res = await axios.get(`/api/products?branchId=${selectedBranchId}`);
      console.log("📝 ProductSaleForm: Loaded products:", res.data.length, "products");
      return res.data;
    },
    enabled: !!selectedBranchId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) {
        console.log("⚠️ ProductSaleForm: No selectedBranchId for clients");
        return [];
      }
      console.log("📝 ProductSaleForm: Loading clients for branch:", selectedBranchId);
      const res = await axios.get(`/api/clients?branchId=${selectedBranchId}`);
      console.log("📝 ProductSaleForm: Loaded clients:", res.data.length, "clients", res.data.map(c => c.name));
      return res.data;
    },
    enabled: !!selectedBranchId,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) {
        console.log("⚠️ ProductSaleForm: No selectedBranchId for professionals");
        return [];
      }
      console.log("📝 ProductSaleForm: Loading professionals for branch:", selectedBranchId);
      const res = await axios.get(`/api/professionals?branchId=${selectedBranchId}`);
      console.log("📝 ProductSaleForm: Loaded professionals:", res.data.length, "professionals", res.data.map(p => p.name));
      return res.data;
    },
    enabled: !!selectedBranchId,
  });

  // Auto-selecionar profissional se for funcionário (não admin)
  const currentProfessionalId = useMemo(() => {
    if (isProfessional && !isAdmin && user?.name && professionals.length > 0) {
      const currentProfessional = professionals.find(p => p.name === user.name);
      return currentProfessional?.id || "";
    }
    return "";
  }, [isProfessional, isAdmin, user?.name, professionals]);
  
  useEffect(() => {
    if (currentProfessionalId) {
      setValue('soldById', currentProfessionalId);
    }
  }, [currentProfessionalId, setValue]);

  const selectedProductId = watch("productId");
  const quantity = watch("quantity") || 0;
  const unitPrice = watch("unitPrice") || 0;
  const total = quantity * unitPrice;

  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  const handleProductChange = (productId: string) => {
    setValue("productId", productId);
    const product = products.find((p: any) => p.id === productId);
    if (product?.salePrice) {
      setValue("unitPrice", Number(product.salePrice));
    } else {
      setValue("unitPrice", 0);
    }
  };

  const createSale = useMutation({
    mutationFn: async (data: SaleFormData) => {
      const selectedClient = data.clientId ? clients.find((c: any) => c.id === data.clientId) : null;
      const clientName = selectedClient?.name;
      
      const saleData = {
        type: "OUT",
        quantity: data.quantity,
        unitCost: data.unitPrice,
        reason: `Venda de produto${clientName ? ` - Cliente: ${clientName}` : ""}${data.notes ? ` - ${data.notes}` : ""}`,
        reference: clientName ? `Cliente: ${clientName}` : undefined,
        soldById: data.soldById || undefined, // undefined se não selecionado
      };
      
      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {};
      const res = await axios.post(`/api/products/${data.productId}/adjust`, saleData, { headers });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Venda registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao registrar venda");
    },
  });

  const onSubmit = (data: SaleFormData) => {
    if (!selectedProduct) {
      toast.error("Produto não encontrado");
      return;
    }
    
    if (data.quantity > selectedProduct.currentStock) {
      toast.error(`Estoque insuficiente. Disponível: ${selectedProduct.currentStock}`);
      return;
    }
    
    createSale.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="h-5 w-5 text-[#D4AF37]" />
        <h3 className="text-lg font-semibold text-[#1A1A1A]">Venda de Produto</h3>
      </div>

      {isAdmin && (
        <div>
          <Label htmlFor="branchId">Filial</Label>
          <Select onValueChange={(value) => setValue("branchId", value)} defaultValue={!isAdmin ? activeBranch?.id : undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma filial" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch: any) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.branchId && (
            <p className="text-sm text-red-600 mt-1">{errors.branchId.message}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="productId">Produto</Label>
        <Select onValueChange={handleProductChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            {products.filter((product: any) => product.currentStock > 0).map((product: any) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} (Estoque: {product.currentStock})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.productId && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.productId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={selectedProduct?.currentStock || 999}
            {...register("quantity", { valueAsNumber: true })}
            placeholder="Quantos foram vendidos"
          />
          {errors.quantity && (
            <p className="text-sm text-[#DC2626] mt-1">{errors.quantity.message}</p>
          )}
          {selectedProduct && (
            <p className="text-xs text-[#737373] mt-1">
              Disponível: {selectedProduct.currentStock}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="unitPrice">Preço Unitário (R$)</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            min="0.01"
            {...register("unitPrice", { valueAsNumber: true })}
            placeholder="Selecione um produto"
            readOnly
            className="bg-[#F5F5F0] cursor-not-allowed"
          />
          {!selectedProduct && (
            <p className="text-xs text-[#737373] mt-1">
              Selecione um produto para ver o preço
            </p>
          )}
          {selectedProduct && (
            <p className="text-xs text-[#737373] mt-1">
              Preço definido no cadastro do produto
            </p>
          )}
        </div>
      </div>

      {total > 0 && (
        <div className="p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
          <div className="flex justify-between items-center">
            <span className="font-medium text-[#1A1A1A]">Total da Venda:</span>
            <span className="text-xl font-bold text-[#D4AF37]">
              R$ {total.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div>
          <Label htmlFor="soldById">Vendedor (opcional)</Label>
          <Select onValueChange={(value) => setValue("soldById", value === "none" ? undefined : value)} defaultValue={currentProfessionalId || "none"}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem vendedor (Admin)</SelectItem>
              {professionals.map((professional: any) => (
                <SelectItem key={professional.id} value={professional.id}>
                  {professional.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Deixe "Sem vendedor" se você (admin) está fazendo a venda
          </p>
        </div>
      )}

      {!isAdmin && (
        <div>
          <Label>Vendedor</Label>
          <Input
            value={professionals.find(p => p.id === currentProfessionalId)?.name || user?.name || ""}
            readOnly
            className="bg-[#F5F5F0] cursor-not-allowed"
          />
        </div>
      )}

      <div>
        <Label htmlFor="clientId">Cliente (opcional)</Label>
        <Select onValueChange={(value) => setValue("clientId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client: any) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}{client.phone && ` - ${client.phone}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Observações sobre a venda"
          rows={2}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting || !selectedProduct || quantity <= 0 || unitPrice <= 0} 
        className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A]"
      >
        {isSubmitting ? "Registrando..." : `Registrar Venda - R$ ${total.toFixed(2)}`}
      </Button>
    </form>
  );
}