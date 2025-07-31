import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";


const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  role: z.string().min(2, "Informe a função"),
  commissionRate: z.number().min(0).max(100, "Comissão deve ser entre 0 e 100%"),
  roleId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProfessionalForm({ 
  onSuccess, 
  initialData 
}: { 
  onSuccess: () => void;
  initialData?: { id: string; name: string; role: string; commissionRate?: number; roleId?: string } | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      try {
        const res = await axios.get("/api/roles");
        return res.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ 
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      name: initialData.name,
      role: initialData.role,
      roleId: initialData.roleId || (initialData as any).customRole?.id,
      commissionRate: (initialData as any).customRole?.commissionRate || initialData.commissionRate || 0
    } : {
      commissionRate: 0
    }
  });

  const selectedRoleId = watch('roleId');
  const selectedRole = roles.find((role: any) => role.id === selectedRoleId);

  // Atualizar role e commissionRate quando uma role customizada for selecionada
  const handleRoleChange = (roleId: string) => {
    setValue('roleId', roleId);
    const role = roles.find((r: any) => r.id === roleId);
    if (role) {
      setValue('role', role.title);
      setValue('commissionRate', role.commissionRate || 0);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('🚀 ProfessionalForm mutation:', { data, isEditing });
      
      if (isEditing) {
        const res = await axios.patch(`/api/professionals/${initialData.id}`, data);
        return res.data;
      } else {
        const res = await axios.post('/api/professionals', data);
        return res.data;
      }
    },
    onSuccess: (result) => {
      console.log('✅ Professional mutation success:', result);
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      onSuccess();
    },
    onError: (error) => {
      console.log('❌ Professional mutation error:', error);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-4"
    >
      <div>
        <Input placeholder="Nome" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <div>
        {roles.length > 0 ? (
          <>
            <Select onValueChange={handleRoleChange} value={selectedRoleId || 'custom'}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Função personalizada</SelectItem>
                {roles.map((role: any) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title} ({role.commissionRate}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRoleId === 'custom' && (
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
      <div>
        <div className="flex items-center">
          <Input 
            type="number" 
            min="0" 
            max="100" 
            step="0.1"
            placeholder="Comissão (%)" 
            {...register("commissionRate")} 
            disabled={selectedRole && selectedRoleId !== 'custom'}
          />
          <span className="ml-2">%</span>
        </div>
        {errors.commissionRate && (
          <p className="text-sm text-red-500">{errors.commissionRate.message}</p>
        )}
        {selectedRole && selectedRoleId !== 'custom' && (
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
        {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar" : "Salvar")}
      </Button>
    </form>
  );
}
