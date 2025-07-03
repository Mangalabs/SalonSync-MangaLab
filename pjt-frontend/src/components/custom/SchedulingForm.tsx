import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Clock } from "lucide-react";

const schema = z.object({
  professionalId: z.string().min(1, "Selecione um profissional"),
  clientId: z.string().min(1, "Selecione um cliente"),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().min(1, "Selecione um horário"),
});

type FormData = z.infer<typeof schema>;

export function SchedulingForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();

  const { control, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      professionalId: "",
      clientId: "",
      serviceIds: [],
      date: "",
      time: "",
    },
  });

  const watchedProfessional = watch("professionalId");
  const watchedDate = watch("date");
  const watchedServices = watch("serviceIds");

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await axios.get("/api/clients");
      return res.data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await axios.get("/api/services");
      return res.data.map((s: any) => ({
        ...s,
        price: Number(s.price),
      }));
    },
  });

  const { data: availableSlots = [] } = useQuery({
    queryKey: ["available-slots", watchedProfessional, watchedDate],
    queryFn: async () => {
      if (!watchedProfessional || !watchedDate) return [];
      const res = await axios.get(`/api/appointments/available-slots/${watchedProfessional}/${watchedDate}`);
      return res.data;
    },
    enabled: !!watchedProfessional && !!watchedDate,
  });

  const createAppointment = useMutation({
    mutationFn: async (data: FormData) => {
      const scheduledAt = `${data.date}T${data.time}:00`;
      await axios.post("/api/appointments", {
        professionalId: data.professionalId,
        clientId: data.clientId,
        serviceIds: data.serviceIds,
        scheduledAt,
        status: 'SCHEDULED'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      reset();
      onSuccess();
    },
  });

  const total = services
    .filter((s: any) => watchedServices.includes(s.id))
    .reduce((sum: number, s: any) => sum + Number(s.price), 0);

  const onSubmit = (data: FormData) => {
    createAppointment.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Data</Label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <Input
              type="date"
              {...field}
              min={new Date().toISOString().split('T')[0]}
            />
          )}
        />
        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
      </div>

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
                {professionals.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.professionalId && <p className="text-sm text-red-500">{errors.professionalId.message}</p>}
      </div>

      {availableSlots.length > 0 && (
        <div>
          <Label>Horário</Label>
          <Controller
            name="time"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot: string) => (
                    <SelectItem key={slot} value={slot}>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {slot}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.time && <p className="text-sm text-red-500">{errors.time.message}</p>}
        </div>
      )}

      <div>
        <Label>Cliente</Label>
        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.clientId && <p className="text-sm text-red-500">{errors.clientId.message}</p>}
      </div>

      <div>
        <Label>Serviços</Label>
        <Controller
          name="serviceIds"
          control={control}
          render={({ field }) => (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {services.map((s: any) => (
                <div key={s.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value.includes(s.id)}
                    onCheckedChange={(checked) => {
                      const set = new Set(field.value);
                      checked ? set.add(s.id) : set.delete(s.id);
                      field.onChange(Array.from(set));
                    }}
                  />
                  <span className="text-sm">
                    {s.name} - R$ {Number(s.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        />
        {errors.serviceIds && <p className="text-sm text-red-500">{errors.serviceIds.message}</p>}
      </div>

      {total > 0 && (
        <div className="font-semibold">
          Total: R$ {total.toFixed(2)}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando..." : "Agendar"}
      </Button>
    </form>
  );
}