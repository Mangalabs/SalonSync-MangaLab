import { Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ServiceSelectorProps {
  control: any;
  services: { id: string; name: string; price: number }[];
  errors: any;
}

export function ServiceSelector({ control, services, errors }: ServiceSelectorProps) {
  return (
    <div>
      <Label className="text-sm">Serviços</Label>
      <Controller
        name="serviceIds"
        control={control}
        render={({ field }) => (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {services.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Checkbox
                  checked={field.value.includes(s.id)}
                  onCheckedChange={(checked) => {
                    const set = new Set(field.value);
                    checked ? set.add(s.id) : set.delete(s.id);
                    field.onChange(Array.from(set));
                  }}
                  className="flex-shrink-0"
                />
                <span className="text-xs sm:text-sm flex-1 min-w-0">
                  <span className="block truncate">{s.name}</span>
                  <span className="text-[#D4AF37] font-medium">R$ {s.price.toFixed(2)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      />
      {errors.serviceIds && (
        <p className="text-xs text-red-500">{errors.serviceIds.message}</p>
      )}
    </div>
  );
}