import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useUser } from "@/contexts/UserContext";

interface ProfessionalSelectorProps {
  control: any;
  professionals: { id: string; name: string }[];
  errors: any;
  branchId?: string;
}

export function ProfessionalSelector({ control, professionals, errors, branchId }: ProfessionalSelectorProps) {
  const { user, isProfessional, isAdmin } = useUser();

  return (
    <div>
      <Label className="text-sm">Profissional</Label>
      <Controller
        name="professionalId"
        control={control}
        render={({ field }) => (
          (isProfessional && !isAdmin) ? (
            <>
              <Input 
                value={user?.name || ""} 
                disabled 
                className="bg-gray-50 h-8 text-sm" 
              />
              <input type="hidden" {...field} />
            </>
          ) : (
            <Combobox
              options={professionals.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Selecione um profissional"
              searchPlaceholder="Pesquisar profissional..."
              disabled={!branchId && isAdmin}
            />
          )
        )}
      />
      {errors.professionalId && (
        <p className="text-xs text-red-500">
          {errors.professionalId.message}
        </p>
      )}
    </div>
  );
}