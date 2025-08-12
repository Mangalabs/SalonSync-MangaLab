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

interface InlineClientFormProps {
  onSuccess: () => void;
  branchId?: string;
}

export function InlineClientForm({ onSuccess, branchId }: InlineClientFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const headers = branchId ? { 'x-branch-id': branchId } : {};
      return axios.post("/api/clients", data, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", branchId] });
      reset();
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-3"
    >
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Nome do cliente"
          className="h-8"
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="(11) 99999-9999"
          className="h-8"
        />
      </div>
      <div>
        <Label htmlFor="email">Email (opcional)</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="cliente@email.com"
          className="h-8"
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full h-8">
        {isSubmitting ? "Criando..." : "Criar Cliente"}
      </Button>
    </form>
  );
}