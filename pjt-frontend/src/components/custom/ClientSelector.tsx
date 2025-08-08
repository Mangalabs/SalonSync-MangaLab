import { Controller } from "react-hook-form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { NavLink } from "react-router-dom";

interface ClientSelectorProps {
  control: any;
  clients: { id: string; name: string }[];
  errors: any;
}

export function ClientSelector({ control, clients, errors }: ClientSelectorProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <Label className="text-sm">Cliente</Label>
        <NavLink
          to="/dashboard/clients"
          className="text-xs sm:text-sm text-blue-600 hover:underline"
        >
          + Cliente
        </NavLink>
      </div>
      <Controller
        name="clientId"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className="h-8 text-sm">
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
        <p className="text-xs text-red-500">{errors.clientId.message}</p>
      )}
    </>
  );
}