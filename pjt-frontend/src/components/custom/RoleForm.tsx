import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "@/lib/axios";

const roleSchema = z.object({
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres"),
  commissionRate: z.number().min(0).max(100).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export function RoleForm({ onSuccess, initialData }: RoleFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      commissionRate: initialData.commissionRate || 0,
    } : {
      commissionRate: 0,
    }
  });

  const createRole = useMutation({
    mutationFn: async (data: RoleFormData) => {
      try {
        if (initialData) {
          const res = await axios.put(`/api/roles/${initialData.id}`, data);
          return res.data;
        } else {
          const res = await axios.post("/api/roles", data);
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

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando..." : initialData ? "Atualizar" : "Criar Função"}
      </Button>
    </form>
  );
}