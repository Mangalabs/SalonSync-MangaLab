import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  role: z.string().min(2, "Informe a função"),
});

type FormData = z.infer<typeof schema>;

export function ProfessionalForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("http://localhost:3000/api/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar profissional");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      onSuccess();
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
