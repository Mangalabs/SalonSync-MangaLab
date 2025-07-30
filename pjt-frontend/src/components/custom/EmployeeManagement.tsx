import { useState, useEffect } from "react";
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
import { UserPlus, Settings } from "lucide-react";
import { RoleForm } from "./RoleForm";

const employeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  roleId: z.string().min(1, "Selecione uma função"),
  branchId: z.string().min(1, "Selecione uma filial"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function EmployeeManagement() {
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await axios.get("/api/branches");
      return res.data;
    },
  });

  const { data: roles = [], refetch: refreshRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      try {
        const res = await axios.get("/api/roles");
        return res.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn('⚠️ Rotas /api/roles não implementadas no backend');
          return []; // Retorna array vazio até backend implementar
        }
        throw error;
      }
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
      branchId: activeBranch?.id || ""
    }
  });

  const createEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      // Buscar dados da função selecionada
      const selectedRole = roles.find(role => role.id === data.roleId);
      const employeeData = {
        ...data,
        role: selectedRole?.title || 'Profissional',
        commissionRate: selectedRole?.commissionRate || 0
      };
      await axios.post("/api/auth/create-employee", employeeData);
    },
    onSuccess: () => {
      toast.success("Funcionário criado com sucesso!");
      reset();
      setOpen(false);
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
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
          <div className="flex gap-2">
            <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#D4AF37]/20 hover:bg-[#D4AF37]/10">
                  <Settings className="h-4 w-4 mr-2" />
                  Criar Função
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Função</DialogTitle>
                </DialogHeader>
                <RoleForm onSuccess={() => {
                  setRoleOpen(false);
                  refreshRoles();
                }} />
              </DialogContent>
            </Dialog>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
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
                    <Label htmlFor="roleId">Função</Label>
                    {roles.length > 0 ? (
                      <>
                        <Select onValueChange={(value) => setValue("roleId", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role: any) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.title} {role.commissionRate > 0 && `(${role.commissionRate}%)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.roleId && (
                          <p className="text-sm text-red-500">{errors.roleId.message}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <Input value="Profissional" disabled className="bg-[#F0F0EB] text-[#737373]" />
                        <input type="hidden" {...register("role" as any)} value="PROFESSIONAL" />
                        <p className="text-xs text-[#8B4513] mt-1">
                          ⚠️ Crie funções primeiro ou aguarde implementação do backend
                        </p>
                      </>
                    )}
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Criando..." : "Criar Funcionário"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#737373]">
              Crie contas para seus funcionários. Cada conta criada aqui:
            </p>
            <ul className="mt-2 text-sm text-[#737373] space-y-1">
              <li>• <strong>Cria usuário:</strong> Login para acessar o sistema</li>
              <li>• <strong>Cria profissional:</strong> Aparece na lista de profissionais</li>
              <li>• <strong>Vincula à filial:</strong> Funcionário fica associado à filial selecionada</li>
              <li>• <strong>Função personalizada:</strong> Título e comissão definidos por você</li>
            </ul>
          </div>
          
          {roles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">Funções Disponíveis:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {roles.map((role: any) => (
                  <div key={role.id} className="border rounded p-2 text-sm">
                    <div className="font-medium">{role.title}</div>
                    <div className="text-[#737373]">
                      {role.commissionRate > 0 ? `${role.commissionRate}% comissão` : 'Sem comissão'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}