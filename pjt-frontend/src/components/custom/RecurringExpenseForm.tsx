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

const recurringExpenseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  fixedAmount: z.union([z.number(), z.nan()]).optional(),
  receiptDay: z.number().min(1, "Dia deve ser entre 1 e 31").max(31, "Dia deve ser entre 1 e 31"),
  dueDay: z.number().min(1, "Dia deve ser entre 1 e 31").max(31, "Dia deve ser entre 1 e 31"),
  professionalId: z.string().optional(),
});

type RecurringExpenseFormData = z.infer<typeof recurringExpenseSchema>;

interface RecurringExpenseFormProps {
  onSuccess: () => void;
}

export function RecurringExpenseForm({ onSuccess }: RecurringExpenseFormProps) {
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "EXPENSE"],
    queryFn: async () => {
      const res = await axios.get("/api/financial/categories?type=EXPENSE");
      return res.data;
    },
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(recurringExpenseSchema),
  });

  const selectedCategoryId = watch("categoryId");
  
  const selectedCategory = categories.find((cat: any) => cat.id === selectedCategoryId);
  const isSalaryCategory = selectedCategory?.name === "Salários";
  
  const handleProfessionalChange = (professionalId: string) => {
    setValue("professionalId", professionalId);
    const professional = professionals.find((p: any) => p.id === professionalId);
    if (professional) {
      setValue("name", `Salário: ${professional.name}`);
      const baseSalary = professional.customRole?.baseSalary || professional.baseSalary;
      const payDay = professional.customRole?.salaryPayDay || professional.salaryPayDay;
      
      if (baseSalary) {
        setValue("fixedAmount", Number(baseSalary));
      }
      if (payDay) {
        setValue("receiptDay", payDay - 2 > 0 ? payDay - 2 : 1);
        setValue("dueDay", payDay);
      }
    }
  };

  const createRecurringExpense = useMutation({
    mutationFn: async (data: RecurringExpenseFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        fixedAmount: isNaN(data.fixedAmount!) ? undefined : data.fixedAmount,
        receiptDay: data.receiptDay,
        dueDay: data.dueDay,
        professionalId: data.professionalId,
      };
      const res = await axios.post("/api/financial/recurring-expenses", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Despesa fixa criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao criar despesa fixa");
    },
  });

  const onSubmit = (data: RecurringExpenseFormData) => {
    createRecurringExpense.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da Despesa</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ex: Conta de Luz, Aluguel, etc."
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Descrição adicional da despesa"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="categoryId">Categoria</Label>
        <Select onValueChange={(value) => setValue("categoryId", value)}>
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
        {errors.categoryId && (
          <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
        )}
      </div>

      {isSalaryCategory && (
        <div>
          <Label htmlFor="professionalId">Funcionário</Label>
          <Select onValueChange={handleProfessionalChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um funcionário" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((professional: any) => {
                const baseSalary = professional.customRole?.baseSalary || professional.baseSalary;
                const payDay = professional.customRole?.salaryPayDay || professional.salaryPayDay;
                
                return (
                  <SelectItem key={professional.id} value={professional.id}>
                    {professional.name} 
                    {baseSalary && `(R$ ${Number(baseSalary).toFixed(2)})`}
                    {payDay && ` - Dia ${payDay}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Selecione o funcionário para puxar automaticamente os dados de salário
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="receiptDay">Dia de Recebimento</Label>
          <Select onValueChange={(value) => setValue("receiptDay", parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Dia do mês" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  Dia {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.receiptDay && (
            <p className="text-sm text-red-600 mt-1">{errors.receiptDay.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Dia do mês que a conta chega
          </p>
        </div>

        <div>
          <Label htmlFor="dueDay">Dia de Vencimento</Label>
          <Select onValueChange={(value) => setValue("dueDay", parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Dia do mês" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  Dia {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.dueDay && (
            <p className="text-sm text-red-600 mt-1">{errors.dueDay.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Dia do mês do vencimento
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="fixedAmount">
          {isSalaryCategory ? "Salário Base" : "Valor Fixo (opcional)"}
        </Label>
        <Input
          id="fixedAmount"
          type="number"
          step="0.01"
          min="0"
          {...register("fixedAmount", { valueAsNumber: true })}
          placeholder={isSalaryCategory ? "Salário base do funcionário" : "Deixe vazio se o valor varia mensalmente"}
          disabled={isSalaryCategory}
        />
        <p className="text-xs text-gray-500 mt-1">
          {isSalaryCategory 
            ? "Valor preenchido automaticamente com base no funcionário selecionado (comissões serão somadas)"
            : "Para despesas como aluguel que têm valor fixo. Deixe vazio para contas que variam como luz/água."
          }
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Criando..." : "Criar Despesa Fixa"}
      </Button>
    </form>
  );
}