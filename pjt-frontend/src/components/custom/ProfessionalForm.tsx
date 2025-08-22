import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import { useBranch } from "@/contexts/BranchContext";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  role: z.string().min(2, "Informe a função"),
  commissionRate: z
    .number()
    .min(0)
    .max(100, "Comissão deve ser entre 0 e 100%"),
  roleId: z.string().optional(),
  baseSalary: z.union([z.number(), z.nan()]).optional(),
  salaryPayDay: z.union([z.number(), z.nan()]).optional(),
  branchId: z.string().min(1, "Selecione uma filial"),
});

type FormData = z.infer<typeof schema>;

export function ProfessionalForm({
  onSuccess,
  initialData,
}: {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    role: string;
    commissionRate?: number;
    roleId?: string;
    branchId?: string;
  } | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          role: initialData.role,
          roleId: initialData.roleId || (initialData as any).customRole?.id,
          commissionRate:
            (initialData as any).customRole?.commissionRate ||
            initialData.commissionRate ||
            0,
          baseSalary: (initialData as any).baseSalary || undefined,
          salaryPayDay: (initialData as any).salaryPayDay || undefined,
          branchId: initialData.branchId || (!isAdmin ? activeBranch?.id : undefined),
        }
      : {
          commissionRate: 0,
          branchId: !isAdmin ? activeBranch?.id : undefined,
        },
  });

  const selectedBranchId = watch("branchId");

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", selectedBranchId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedBranchId) params.append("branchId", selectedBranchId);
        const res = await axios.get(`/api/roles?${params}`);
        return res.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!selectedBranchId,
  });

  const selectedRoleId = watch("roleId");
  const selectedRole = roles.find((role: any) => role.id === selectedRoleId);
  const isCustomRole = selectedRoleId === "custom" || !selectedRoleId;

  const handleRoleChange = (roleId: string) => {
    setValue("roleId", roleId);
    const role = roles.find((r: any) => r.id === roleId);
    if (role) {
      setValue("role", role.title);
      setValue("commissionRate", role.commissionRate || 0);
      setValue("baseSalary", role.baseSalary ? Number(role.baseSalary) : undefined);
      setValue("salaryPayDay", role.salaryPayDay || undefined);
    } else {
      // Função personalizada - limpar valores
      setValue("baseSalary", undefined);
      setValue("salaryPayDay", undefined);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("🚀 ProfessionalForm mutation:", { data, isEditing });

      const headers = data.branchId ? { 'x-branch-id': data.branchId } : {};
      if (isEditing) {
        const res = await axios.patch(
          `/api/professionals/${initialData.id}`,
          data,
          { headers }
        );
        return res.data;
      } else {
        const res = await axios.post("/api/professionals", data, { headers });
        return res.data;
      }
    },
    onSuccess: (result) => {
      console.log("✅ Professional mutation success:", result);
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      onSuccess();
    },
    onError: (error) => {
      console.log("❌ Professional mutation error:", error);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-4"
    >
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
        <Label htmlFor="name">Nome do Funcionário</Label>
        <Input placeholder="Nome" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <div>
        {roles.length > 0 ? (
          <>
            <Combobox
              options={[
                { value: "custom", label: "Função personalizada" },
                ...roles.map((role: any) => ({
                  value: role.id,
                  label: `${role.title} (${role.commissionRate}%)`
                }))
              ]}
              value={selectedRoleId || "custom"}
              onValueChange={handleRoleChange}
              placeholder="Selecione uma função"
              searchPlaceholder="Pesquisar função..."
            />
            {selectedRoleId === "custom" && (
              <div className="mt-2">
                <Input placeholder="Nome da função" {...register("role")} />
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <Input placeholder="Função (ex: Barbeiro)" {...register("role")} />
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </>
        )}
      </div>
      
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3">
          Configuração de Salário 
          {!isCustomRole && selectedRole?.baseSalary && (
            <span className="text-xs font-normal text-gray-500">
              (Herdado da função: R$ {Number(selectedRole.baseSalary).toFixed(2)})
            </span>
          )}
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={selectedRole?.baseSalary ? `Padrão: R$ ${Number(selectedRole.baseSalary).toFixed(2)}` : "Salário base (R$)"}
              {...register("baseSalary", { valueAsNumber: true })}
              disabled={!isCustomRole && selectedRole?.baseSalary}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isCustomRole 
                ? "Valor fixo mensal personalizado"
                : selectedRole?.baseSalary 
                  ? "Definido pela função selecionada"
                  : "Valor fixo mensal (comissões serão somadas)"
              }
            </p>
          </div>
          
          <div>
            <Input
              type="number"
              min="1"
              max="31"
              placeholder={selectedRole?.salaryPayDay ? `Padrão: Dia ${selectedRole.salaryPayDay}` : "Dia do pagamento"}
              {...register("salaryPayDay", { valueAsNumber: true })}
              disabled={!isCustomRole && selectedRole?.salaryPayDay}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isCustomRole 
                ? "Dia do mês personalizado"
                : selectedRole?.salaryPayDay 
                  ? "Definido pela função selecionada"
                  : "Dia do mês para gerar despesa"
              }
            </p>
          </div>
        </div>
        
        {!isCustomRole && selectedRole && (
          <p className="text-xs text-blue-600 mt-2">
            ℹ️ Para personalizar salário, selecione "Função personalizada"
          </p>
        )}
      </div>
      <div>
        <div className="flex items-center">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="Comissão (%)"
            {...register("commissionRate", { valueAsNumber: true })}
            disabled={selectedRole && selectedRoleId !== "custom"}
          />
          <span className="ml-2">%</span>
        </div>
        {errors.commissionRate && (
          <p className="text-sm text-red-500">
            {errors.commissionRate.message}
          </p>
        )}
        {selectedRole && selectedRoleId !== "custom" && (
          <p className="text-xs text-[#737373] mt-1">
            Comissão definida pela função selecionada
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-white"
      >
        {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
      </Button>
    </form>
  );
}
