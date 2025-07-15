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
import { Input } from "@/components/ui/input";
import { NavLink } from "react-router-dom";
import axios from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/contexts/BranchContext";
import { toast } from "sonner";

const immediateSchema = z.object({
  professionalId: z.string().min(1, "Selecione um profissional"),
  clientId: z.string().min(1, "Selecione um cliente"),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
});

const scheduledSchema = z.object({
  professionalId: z.string().min(1, "Selecione um profissional"),
  clientId: z.string().min(1, "Selecione um cliente"),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  scheduledDate: z.string().min(1, "Data é obrigatória"),
  scheduledTime: z.string().min(1, "Horário é obrigatório"),
});

type ImmediateFormData = z.infer<typeof immediateSchema>;
type ScheduledFormData = z.infer<typeof scheduledSchema>;

export function AppointmentForm({ 
  onSuccess, 
  mode = "immediate" 
}: { 
  onSuccess: () => void;
  mode?: "immediate" | "scheduled";
}) {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();

  const isScheduled = mode === "scheduled";
  
  const {
    control,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isScheduled ? scheduledSchema : immediateSchema),
    defaultValues: isScheduled ? {
      professionalId: "", 
      clientId: "", 
      serviceIds: [],
      scheduledDate: "",
      scheduledTime: ""
    } : {
      professionalId: "", 
      clientId: "", 
      serviceIds: []
    },
  });
  
  const selectedProfessional = watch("professionalId");
  const selectedDate = isScheduled ? watch("scheduledDate") : undefined;

  const { data: professionals = [] } = useQuery<
    { id: string; name: string }[],
    Error
  >({
    queryKey: ["professionals", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const { data: clients = [] } = useQuery<
    { id: string; name: string }[],
    Error
  >({
    queryKey: ["clients", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/clients");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const { data: services = [] } = useQuery<
    { id: string; name: string; price: number }[],
    Error
  >({
    queryKey: ["services", activeBranch?.id],
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
    enabled: !!activeBranch,
  });
  
  const { data: availableSlots = [] } = useQuery({
    queryKey: ["available-slots", selectedProfessional, selectedDate],
    queryFn: async () => {
      const res = await axios.get(`/api/appointments/available-slots/${selectedProfessional}/${selectedDate}`);
      return res.data;
    },
    enabled: isScheduled && !!selectedProfessional && !!selectedDate,
  });

  const total = useMemo(() => {
    const selected = getValues("serviceIds");
    return (
      services
        .filter((s) => selected.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0) || 0
    );
  }, [getValues, services]);

  const { mutate } = useMutation({
    mutationFn: async (data: any) => {
      console.log('Form data:', data);
      console.log('Is scheduled:', isScheduled);
      
      let scheduledAt: string;
      let status: string;
      
      if (isScheduled && 'scheduledDate' in data && 'scheduledTime' in data) {
        scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString();
        status = "SCHEDULED";
      } else {
        scheduledAt = new Date().toISOString();
        status = "COMPLETED";
      }
      
      const payload = {
        clientId: data.clientId,
        professionalId: data.professionalId,
        serviceIds: data.serviceIds,
        scheduledAt,
        status
      };
      
      console.log('Payload:', payload);
      
      await axios.post("/api/appointments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(isScheduled ? "Agendamento criado com sucesso!" : "Atendimento registrado com sucesso!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Erro ao ${isScheduled ? 'criar agendamento' : 'registrar atendimento'}`);
    
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
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

      {isScheduled && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scheduledDate">Data</Label>
            <Controller
              name="scheduledDate"
              control={control}
              render={({ field }) => (
                <Input
                  id="scheduledDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...field}
                />
              )}
            />
            {isScheduled && (errors as any).scheduledDate && (
              <p className="text-sm text-red-500">{(errors as any).scheduledDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="scheduledTime">Horário</Label>
            <Controller
              name="scheduledTime"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.length > 0 ? (
                      availableSlots.map((time: string) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {selectedProfessional && selectedDate ? "Nenhum horário disponível" : "Selecione profissional e data"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {isScheduled && (errors as any).scheduledTime && (
              <p className="text-sm text-red-500">{(errors as any).scheduledTime.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="font-semibold">Total: R$ {total.toFixed(2)}</div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : (isScheduled ? "Agendar" : "Finalizar")}
      </Button>
    </form>
  );
}
