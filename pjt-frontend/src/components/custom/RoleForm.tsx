import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import { useBranch } from "@/contexts/BranchContext";

const roleSchema = z.object({
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres"),
  commissionRate: z.number().min(0).max(100).optional(),
  baseSalary: z.union([z.number(), z.nan()]).optional(),
  salaryPayDay: z.union([z.number(), z.nan()]).optional(),
  branchId: z.string().min(1, "Selecione uma filial"),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export function RoleForm({ onSuccess, initialData }: RoleFormProps) {
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
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      commissionRate: initialData.commissionRate || 0,
      baseSalary: initialData.baseSalary || undefined,
      salaryPayDay: initialData.salaryPayDay || undefined,
      branchId: initialData.branchId || (!isAdmin ? activeBranch?.id : undefined),
    } : {
      commissionRate: 0,
      branchId: !isAdmin ? activeBranch?.id : undefined,
    }
  });

  const createRole = useMutation({
    mutationFn: async (data: RoleFormData) => {
      try {
        const headers = data.branchId ? { 'x-branch-id': data.branchId } : {};
        if (initialData) {
          const res = await axios.patch(`/api/roles/${initialData.id}`, data, { headers });
          return res.data;
        } else {
          const res = await axios.post("/api/roles", data, { headers });
          return res.data;
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error('Rotas /api/roles não implementadas no backend. Consulte BACKEND_IMPLEMENTATION_PRIORITY.md');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(initialData ? "Função atualizada!" : "Função criada!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao salvar função");
    },
  });

  const onSubmit = (data: RoleFormData) => {
    createRole.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isAdmin && (
        <div>
          <Label htmlFor="branchId">Filial</Label>
          <Select onValueChange={(value) => setValue("branchId", value)} defaultValue={!isAdmin ? activeBranch?.id : initialData?.branchId}>
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
        <Label htmlFor="title">Título da Função</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Ex: Barbeiro, Manicure, Gerente"
        />
        {errors.title && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="commissionRate">Porcentagem de Comissão (%)</Label>
        <Input
          id="commissionRate"
          type="number"
          step="0.01"
          min="0"
          max="100"
          {...register("commissionRate", { valueAsNumber: true })}
          placeholder="0"
        />
        {errors.commissionRate && (
          <p className="text-sm text-[#DC2626] mt-1">{errors.commissionRate.message}</p>
        )}
        <p className="text-xs text-[#737373] mt-1">
          Deixe 0 se não houver comissão para esta função
        </p>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3">Configuração de Salário (Opcional)</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="baseSalary">Salário Base (R$)</Label>
            <Input
              id="baseSalary"
              type="number"
              step="0.01"
              min="0"
              {...register("baseSalary", { valueAsNumber: true })}
              placeholder="0,00"
            />
            <p className="text-xs text-[#737373] mt-1">
              Valor fixo mensal para esta função
            </p>
          </div>
          
          <div>
            <Label htmlFor="salaryPayDay">Dia do Pagamento</Label>
            <Input
              id="salaryPayDay"
              type="number"
              min="1"
              max="31"
              {...register("salaryPayDay", { valueAsNumber: true })}
              placeholder="5"
            />
            <p className="text-xs text-[#737373] mt-1">
              Dia do mês para gerar despesa
            </p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando..." : initialData ? "Atualizar" : "Criar Função"}
      </Button>
    </form>
  );
}