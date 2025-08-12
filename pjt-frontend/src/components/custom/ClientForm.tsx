import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import { useBranch } from "@/contexts/BranchContext";

const createClientSchema = (isAdmin: boolean) => z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  ...(isAdmin && { branchId: z.string().min(1, "Selecione uma filial") }),
});

type ClientFormData = {
  name: string;
  phone?: string;
  email?: string;
  branchId?: string;
};

export function ClientForm({
  onSuccess,
  initialData,
}: {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    branchId?: string;
  } | null;
}) {
  const isEditing = !!initialData;
  const queryClient = useQueryClient();
  const { isAdmin } = useUser();
  const { activeBranch } = useBranch();
  
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await axios.get("/api/branches");
      return res.data;
    },
    enabled: isAdmin,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(createClientSchema(isAdmin)),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      branchId: !isAdmin ? activeBranch?.id : undefined,
    },
  });

  const selectedBranchId = watch("branchId");
  
  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
      };
      const branchIdToUse = selectedBranchId || data.branchId;
      const headers = branchIdToUse ? { 'x-branch-id': branchIdToUse } : {};
      

      
      if (isEditing) {
        return axios.patch(`/api/clients/${initialData.id}`, payload, { headers });
      } else {
        return axios.post("/api/clients", payload, { headers });
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      reset();
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-4"
    >
      {isAdmin && (
        <div>
          <Label htmlFor="branchId">Filial</Label>
          <Select onValueChange={(value) => setValue("branchId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma filial" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch: any) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.branchId && (
            <p className="text-sm text-red-500">{errors.branchId.message}</p>
          )}
        </div>
      )}
      
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" {...register("phone")} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
      </Button>
    </form>
  );
}
