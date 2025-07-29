import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const employeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.string().default("PROFESSIONAL"),
  branchId: z.string().min(1, "Selecione uma filial"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function EmployeeManagement() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await axios.get("/api/branches");
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: "PROFESSIONAL",
      branchId: activeBranch?.id || ""
    }
  });

  const createEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      await axios.post("/api/auth/create-employee", data);
    },
    onSuccess: () => {
      toast.success("Funcionário criado com sucesso!");
      reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao criar funcionário");
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    createEmployee.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gerenciar Funcionários</span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Funcionário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="branchId">Filial</Label>
                  <Select onValueChange={(value) => setValue("branchId", value)} defaultValue={activeBranch?.id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a filial" />
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

                <div>
                  <Label htmlFor="role">Perfil</Label>
                  <Input value="Profissional" disabled className="bg-gray-50" />
                  <input type="hidden" {...register("role")} value="PROFESSIONAL" />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Criando..." : "Criar Funcionário"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Crie contas para seus profissionais. Cada conta criada aqui:
        </p>
        <ul className="mt-2 text-sm text-gray-600 space-y-1">
          <li>• <strong>Cria usuário:</strong> Login para acessar o sistema</li>
          <li>• <strong>Cria profissional:</strong> Aparece na lista de profissionais com comissões</li>
          <li>• <strong>Vincula à filial:</strong> Profissional fica associado à filial selecionada</li>
          <li>• <strong>Taxa padrão:</strong> 10% de comissão (editável em Profissionais)</li>
        </ul>
      </CardContent>
    </Card>
  );
}