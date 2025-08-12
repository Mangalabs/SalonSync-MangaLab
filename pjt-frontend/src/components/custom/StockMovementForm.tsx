import { useForm } from "react-hook-form";
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


const movementSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "LOSS"]),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  unitCost: z.number().optional(),
  reason: z.string().min(1, "Informe o motivo"),
  reference: z.string().optional(),
  branchId: z.string().min(1, "Selecione uma filial"),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface StockMovementFormProps {
  onSuccess: () => void;
}

export function StockMovementForm({ onSuccess }: StockMovementFormProps) {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useUser();
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
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      branchId: !isAdmin ? activeBranch?.id : undefined,
    },
  });

  const selectedBranchId = watch("branchId");

  const { data: products = [] } = useQuery({
    queryKey: ["products", selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBranchId) params.append("branchId", selectedBranchId);
      const res = await axios.get(`/api/products?${params}`);
      return res.data;
    },
    enabled: !!selectedBranchId,
  });

  const movementType = watch("type");

  const createMovement = useMutation({
    mutationFn: async (data: MovementFormData) => {
      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {};
      const res = await axios.post(`/api/products/${data.productId}/adjust`, {
        type: data.type,
        quantity: data.quantity,
        unitCost: data.unitCost,
        reason: data.reason,
        reference: data.reference,
      }, { headers });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Movimentação registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao registrar movimentação");
    },
  });

  const onSubmit = (data: MovementFormData) => {
    createMovement.mutate(data);
  };



  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Select onValueChange={(value) => setValue("productId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product: any) => (
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

      <div>
        <Label htmlFor="type">Tipo de Movimentação</Label>
        <Select onValueChange={(value) => setValue("type", value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">Entrada</SelectItem>
            <SelectItem value="OUT">Saída</SelectItem>
            <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
            <SelectItem value="LOSS">Perda</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.type.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="quantity">Quantidade</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          {...register("quantity", { valueAsNumber: true })}
          placeholder="Digite a quantidade"
        />
        {errors.quantity && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.quantity.message}</p>
        )}
      </div>

      {(movementType === "IN" || movementType === "OUT") && (
        <div>
          <Label htmlFor="unitCost">Custo Unitário (R$)</Label>
          <Input
            id="unitCost"
            type="number"
            step="0.01"
            min="0"
            {...register("unitCost", { valueAsNumber: true })}
            placeholder="0,00"
          />
          <p className="text-xs text-[#737373] mt-1">
            {movementType === "IN" ? "Custo de compra do produto" : "Valor de venda do produto"}
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="reason">Motivo</Label>
        <Textarea
          id="reason"
          {...register("reason")}
          placeholder="Descreva o motivo da movimentação"
          rows={3}
        />
        {errors.reason && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.reason.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="reference">Referência (opcional)</Label>
        <Input
          id="reference"
          {...register("reference")}
          placeholder="Nota fiscal, pedido, etc."
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Registrando..." : "Registrar Movimentação"}
      </Button>
    </form>
  );
}