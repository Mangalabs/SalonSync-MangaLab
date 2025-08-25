import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import { useBranch } from "@/contexts/BranchContext";

const recurringExpenseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  fixedAmount: z.union([z.number(), z.nan()]).optional(),
  receiptDay: z.number().min(1, "Dia deve ser entre 1 e 31").max(31, "Dia deve ser entre 1 e 31"),
  dueDay: z.number().min(1, "Dia deve ser entre 1 e 31").max(31, "Dia deve ser entre 1 e 31"),
  professionalId: z.string().optional(),
  branchId: z.string().min(1, "Selecione uma filial"),
});

type RecurringExpenseFormData = z.infer<typeof recurringExpenseSchema>;

interface RecurringExpenseFormProps {
  onSuccess: () => void;
}

export function RecurringExpenseForm({ onSuccess }: RecurringExpenseFormProps) {
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
  } = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      branchId: !isAdmin ? activeBranch?.id : undefined,
    },
  });

  const selectedBranchId = watch("branchId");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "EXPENSE", selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "EXPENSE" });
      if (selectedBranchId) params.append("branchId", selectedBranchId);
      const res = await axios.get(`/api/financial/categories?${params}`);
      return res.data;
    },
    enabled: !!selectedBranchId,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await axios.get(`/api/professionals?branchId=${selectedBranchId}`);
      return res.data;
    },
    enabled: !!selectedBranchId,
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
      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {};
      const res = await axios.post("/api/financial/recurring-expenses", payload, { headers });
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
    // Validar se dia de vencimento é após dia de recebimento
    if (data.receiptDay && data.dueDay && data.receiptDay > data.dueDay) {
      toast.error("O dia de vencimento deve ser após o dia de recebimento");
      return;
    }
    createRecurringExpense.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isAdmin && (
        <div>
          <Label htmlFor="branchId">Filial</Label>
          <Combobox
            options={branches.map((branch: any) => ({
              value: branch.id,
              label: branch.name,
            }))}
            value={watch("branchId")}
            onValueChange={(value) => setValue("branchId", value)}
            placeholder="Selecione uma filial"
            searchPlaceholder="Pesquisar filial..."
          />
          {errors.branchId && (
            <p className="text-sm text-red-600 mt-1">{errors.branchId.message}</p>
          )}
        </div>
      )}

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
        <Combobox
          options={categories.map((category: any) => ({
            value: category.id,
            label: category.name,
          }))}
          value={selectedCategoryId}
          onValueChange={(value) => setValue("categoryId", value)}
          placeholder="Selecione uma categoria"
          searchPlaceholder="Pesquisar categoria..."
        />
        {errors.categoryId && (
          <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
        )}
      </div>

      {isSalaryCategory && (
        <div>
          <Label htmlFor="professionalId">Funcionário</Label>
          <Combobox
            options={professionals.map((professional: any) => {
              const baseSalary = professional.customRole?.baseSalary || professional.baseSalary;
              const payDay = professional.customRole?.salaryPayDay || professional.salaryPayDay;
              
              return {
                value: professional.id,
                label: `${professional.name}${baseSalary ? ` (R$ ${Number(baseSalary).toFixed(2)})` : ''}${payDay ? ` - Dia ${payDay}` : ''}`
              };
            })}
            value={watch("professionalId")}
            onValueChange={handleProfessionalChange}
            placeholder="Selecione um funcionário"
            searchPlaceholder="Pesquisar funcionário..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Selecione o funcionário para puxar automaticamente os dados de salário
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="receiptDay">Dia de Recebimento</Label>
          <Combobox
            options={Array.from({ length: 31 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `Dia ${i + 1}`
            }))}
            value={watch("receiptDay")?.toString()}
            onValueChange={(value) => setValue("receiptDay", parseInt(value))}
            placeholder="Dia do mês"
            searchPlaceholder="Pesquisar dia..."
          />
          {errors.receiptDay && (
            <p className="text-sm text-red-600 mt-1">{errors.receiptDay.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Dia do mês que a conta chega
          </p>
        </div>

        <div>
          <Label htmlFor="dueDay">Dia de Vencimento</Label>
          <Combobox
            options={Array.from({ length: 31 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `Dia ${i + 1}`
            }))}
            value={watch("dueDay")?.toString()}
            onValueChange={(value) => setValue("dueDay", parseInt(value))}
            placeholder="Dia do mês"
            searchPlaceholder="Pesquisar dia..."
          />
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