import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import axios from "@/lib/axios";
import { toast } from "sonner";

const transactionSchema = z.object({
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const res = await axios.get(`/api/financial/categories?type=${type}`);
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: "CASH"
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      return axios.post("/api/financial/transactions", {
        ...data,
        amount: Number(data.amount),
        type
      });
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

  const getTypeColor = () => {
    switch (type) {
      case "INCOME": return "text-[#D4AF37]";
      case "EXPENSE": return "text-red-600";
      case "INVESTMENT": return "text-blue-600";
    }
  };

  const getTypeName = () => {
    switch (type) {
      case "INCOME": return "Receita";
      case "EXPENSE": return "Despesa";
      case "INVESTMENT": return "Investimento";
    }
  };

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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