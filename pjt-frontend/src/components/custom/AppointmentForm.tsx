// src/components/custom/AppointmentForm.tsx
import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- Validação com Zod ---
const schema = z.object({
  professionalId: z.string().min(1, "Selecione um profissional"),
  clientId: z.string().min(1, "Selecione um cliente"),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
});
type FormData = z.infer<typeof schema>;

export function AppointmentForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();

  // react-hook-form + Zod
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { professionalId: "", clientId: "", serviceIds: [] },
  });

  // --- Consultas de lookup ---
  const { data: professionals = [] } = useQuery<
    { id: string; name: string }[],
    Error
  >({
    queryKey: ["professionals"],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
  });

  const { data: clients = [] } = useQuery<
    { id: string; name: string }[],
    Error
  >({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await axios.get("/api/clients");
      return res.data;
    },
  });

  // --- Garante price:number via select ---
  const { data: services = [] } = useQuery<
    { id: string; name: string; price: number }[],
    Error
  >({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await axios.get("/api/services");
      return res.data as any[];
    },
    select: (raw) =>
      (raw as any[]).map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
      })),
  });

  // --- Cálculo do total ---
  const total = useMemo(() => {
    const selected = getValues("serviceIds");
    return (
      services
        .filter((s) => selected.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0) || 0
    );
  }, [getValues, services]);

  // --- Mutation para criar atendimento ---
  const { mutate } = useMutation<void, Error, FormData>({
    mutationFn: async (data) => {
      await axios.post("/api/appointments", data);
    },
    onSuccess: () => {
      // <— Aqui usamos objeto para queryKey
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
      {/* Profissional */}
      <div>
        <Label>Profissional</Label>
        <Controller
          name="professionalId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        {errors.professionalId && (
          <p className="text-sm text-red-500">
            {errors.professionalId.message}
          </p>
        )}
      </div>

      {/* Cliente */}
      <div className="flex justify-between items-center">
        <Label>Cliente</Label>
        <NavLink
          to="/dashboard/clients"
          className="text-sm text-blue-200 hover:underline"
        >
          + Cliente
        </NavLink>
      </div>
      <Controller
        name="clientId"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />
      {errors.clientId && (
        <p className="text-sm text-red-500">{errors.clientId.message}</p>
      )}

      {/* Serviços */}
      <div>
        <Label>Serviços</Label>
        <Controller
          name="serviceIds"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="flex items-center">
                  <Checkbox
                    checked={field.value.includes(s.id)}
                    onCheckedChange={(checked) => {
                      const set = new Set(field.value);
                      checked ? set.add(s.id) : set.delete(s.id);
                      field.onChange(Array.from(set));
                    }}
                  />
                  <span className="ml-2">
                    {s.name} – R$ {s.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        />
        {errors.serviceIds && (
          <p className="text-sm text-red-500">{errors.serviceIds.message}</p>
        )}
      </div>

      {/* Total & Botão */}
      <div className="font-semibold">Total: R$ {total.toFixed(2)}</div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Finalizar"}
      </Button>
    </form>
  );
}
