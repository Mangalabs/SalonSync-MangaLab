import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
});

type FormData = z.infer<typeof schema>;

export function ServiceForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
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
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
