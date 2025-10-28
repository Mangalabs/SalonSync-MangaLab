import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "@/lib/axios";

const schema = z.object({
  planName: z.string().min(2, "Informe o nome"),
  value: z.number(),
});

type FormData = z.infer<typeof schema>;

export function FidelityForm({
  initialData,
  onSuccess,
}: {
  initialData?: {
    product: { id: string; name: string };
    id: string;
    unit_amount: number;
  } | null;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          planName: initialData.product.name,
          value: initialData.unit_amount / 100,
        }
      : {
          planName: "",
          value: null,
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        const res = await axios.post(
          "/api/payment/update-prices-for-connected-account",
          { ...data, planId: initialData.product.id, priceId: initialData.id }
        );
        return res.data;
      } else {
        const res = await axios.post(
          "/api/payment/create-prices-for-connected-account",
          data
        );
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plano salvo com sucesso!");
      reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao salvar o plano.");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Nome do Plano
        </label>
        <input
          {...register("planName")}
          placeholder="Plano Premium"
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
        />
        {errors.planName && (
          <p className="text-xs text-destructive mt-1">
            {errors.planName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Valor do Plano
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="R$400,00"
          {...register("value", { valueAsNumber: true })}
          className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
        />
        {errors.value && (
          <p className="text-xs text-destructive mt-1">
            {errors.value.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:opacity-80 transition-opacity cursor-pointer"
      >
        {isSubmitting
          ? "Salvando..."
          : isEditing
          ? "Atualizar Plano"
          : "Salvar Plano"}
      </button>
    </form>
  );
}
