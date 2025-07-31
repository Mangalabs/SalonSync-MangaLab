import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAppointmentForm } from "@/hooks/useAppointmentForm";
import { useFormQueries } from "@/hooks/useFormQueries";
import { ProfessionalSelector } from "./ProfessionalSelector";
import { ClientSelector } from "./ClientSelector";
import { ServiceSelector } from "./ServiceSelector";
import { SchedulingFields } from "./SchedulingFields";



export function AppointmentForm({ 
  onSuccess, 
  mode = "immediate" 
}: { 
  onSuccess: () => void;
  mode?: "immediate" | "scheduled";
}) {
  const isScheduled = mode === "scheduled";
  
  // Primeiro buscar os dados básicos
  const { professionals, clients, services } = useFormQueries();
  const { form, mutation } = useAppointmentForm(mode, professionals, onSuccess);
  
  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = form;
  const selectedProfessional = watch("professionalId");
  const selectedDate = isScheduled ? watch("scheduledDate" as any) : undefined;
  
  // Depois buscar slots disponíveis com os valores selecionados
  const { availableSlots } = useFormQueries(selectedProfessional, selectedDate, isScheduled);



  const watchedServices = watch("serviceIds");
  const total = useMemo(() => {
    return (
      services
        .filter((s) => watchedServices?.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0) || 0
    );
  }, [watchedServices, services]);

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-3">
      <ProfessionalSelector 
        control={control} 
        professionals={professionals} 
        errors={errors} 
      />
      
      <ClientSelector 
        control={control} 
        clients={clients} 
        errors={errors} 
      />
      
      <ServiceSelector 
        control={control} 
        services={services} 
        errors={errors} 
      />

      {isScheduled && (
        <SchedulingFields
          control={control}
          errors={errors}
          availableSlots={availableSlots}
          selectedProfessional={selectedProfessional || ""}
          selectedDate={selectedDate || ""}
        />
      )}

      <div className="font-semibold text-sm sm:text-base text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded">
        Total: R$ {total.toFixed(2)}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full text-sm h-8">
        {isSubmitting ? "Salvando..." : (isScheduled ? "Agendar" : "Finalizar")}
      </Button>
    </form>
  );
}
