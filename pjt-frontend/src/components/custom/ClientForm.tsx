import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export function ClientForm({
  onSuccess,
  initialData,
}: {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  } | null;
}) {
  const isEditing = !!initialData;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          phone: initialData.phone || "",
          email: initialData.email || "",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (isEditing) {
        return axios.patch(`/api/clients/${initialData.id}`, data);
      } else {
        return axios.post("/api/clients", data);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      reset();
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" {...register("phone")} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
      </Button>
    </form>
  );
}
