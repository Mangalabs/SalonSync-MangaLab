import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { useBranch } from "@/contexts/BranchContext";
import { useUser } from "@/contexts/UserContext";

const transactionSchema = z.object({
  branchId: z.string().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Valor deve ser um número positivo" }
  ),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  date: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
  onSuccess: () => void;
}

export function TransactionForm({ type, onSuccess }: TransactionFormProps) {
  const queryClient = useQueryClient();
  const { activeBranch, branches } = useBranch();
  const { isAdmin } = useUser();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      branchId: activeBranch?.id || "",
      date: new Date().toISOString().split('T')[0],
      paymentMethod: "CASH"
    }
  });

  const watchedBranch = watch("branchId");
  const selectedBranchId = isAdmin ? watchedBranch : activeBranch?.id;

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", type, selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams({ type });
      if (selectedBranchId) {
        params.append('branchId', selectedBranchId);
      }
      const res = await axios.get(`/api/financial/categories?${params}`);
      return res.data;
    },
    enabled: !!selectedBranchId,
  });



  const mutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const config = isAdmin && data.branchId ? {
        headers: { 'x-branch-id': data.branchId }
      } : {};
      
      return axios.post("/api/financial/transactions", {
        ...data,
        amount: Number(data.amount),
        type
      }, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Transação criada com sucesso!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao criar transação");
    },
  });



  const getTypeName = () => {
    switch (type) {
      case "INCOME": return "Receita";
      case "EXPENSE": return "Despesa";
      case "INVESTMENT": return "Investimento";
    }
  };

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      {isAdmin && (
        <div>
          <Label htmlFor="branchId">Filial</Label>
          <Controller
            name="branchId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a filial..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input 
          id="description" 
          {...register("description")} 
          placeholder={`Descreva esta ${getTypeName().toLowerCase()}`}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input 
            id="amount" 
            {...register("amount")} 
            type="number" 
            step="0.01" 
            min="0"
            placeholder="0,00"
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="date">Data</Label>
          <Input 
            id="date" 
            {...register("date")} 
            type="date"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="categoryId">Categoria</Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoryId && (
          <p className="text-sm text-red-500">{errors.categoryId.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Dinheiro</SelectItem>
                <SelectItem value="CARD">Cartão</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="TRANSFER">Transferência</SelectItem>
                <SelectItem value="OTHER">Outros</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <Label htmlFor="reference">Referência (opcional)</Label>
        <Input 
          id="reference" 
          {...register("reference")} 
          placeholder="Nota fiscal, comprovante, etc."
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando..." : `Salvar ${getTypeName()}`}
      </Button>
    </form>
  );
}