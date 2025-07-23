import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  role: z.string().min(2, "Informe a função"),
  commissionRate: z.union([
    z.string(),
    z.number()
  ]).transform(val => typeof val === 'string' ? parseFloat(val) : val)
    .refine(val => !isNaN(val) && val >= 0 && val <= 100, {
      message: "Comissão deve ser entre 0 e 100%"
    })
    .optional()
    .default(0)
});

type FormData = z.infer<typeof schema>;

export function ProfessionalForm({ 
  onSuccess, 
  initialData 
}: { 
  onSuccess: () => void;
  initialData?: { id: string; name: string; role: string; commissionRate?: number } | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ 
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      name: initialData.name,
      role: initialData.role,
      commissionRate: initialData.commissionRate || 0
    } : {
      commissionRate: 0
    }
  });

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
        <Input placeholder="Função (ex: Barbeiro)" {...register("role")} />
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
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
          />
          <span className="ml-2">%</span>
        </div>
        {errors.commissionRate && (
          <p className="text-sm text-red-500">{errors.commissionRate.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#FF5D73] text-white"
      >
        {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar" : "Salvar")}
      </Button>
    </form>
  );
}
