import { Controller } from "react-hook-form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";

interface ProfessionalSelectorProps {
  control: any;
  professionals: { id: string; name: string }[];
  errors: any;
}

export function ProfessionalSelector({ control, professionals, errors }: ProfessionalSelectorProps) {
  const { user, isProfessional } = useUser();

  return (
    <div>
      <Label className="text-sm">Profissional</Label>
      <Controller
        name="professionalId"
        control={control}
        render={({ field }) => (
          isProfessional ? (
            <>
              <Input 
                value={user?.name || ""} 
                disabled 
                className="bg-gray-50 h-8 text-sm" 
              />
              <input type="hidden" {...field} />
            </>
          ) : (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="h-8 text-sm">
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