import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
});

type FormData = z.infer<typeof schema>;

export function ServiceForm({ 
  onSuccess, 
  initialData 
}: { 
  onSuccess: () => void;
  initialData?: { id: string; name: string; price: string } | null;
}) {
  const isEditing = !!initialData;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      name: initialData.name,
      price: Number(initialData.price)
    } : undefined
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        const res = await axios.patch(`/api/services/${initialData.id}`, data);
        return res.data;
      } else {
        const res = await axios.post('/api/services', data);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      reset();
      onSuccess();
    },
    onError: (error) => {
      console.log('❌ Service mutation error:', error);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-4"
    >
      <div>
        <Input placeholder="Nome do serviço" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Input
          placeholder="Preço (ex: 30)"
          type="number"
          {...register("price")}
        />
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message}</p>
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
