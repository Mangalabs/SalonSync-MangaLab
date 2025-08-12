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
import { UserPlus, Settings, Edit } from "lucide-react";
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
  const [editingRole, setEditingRole] = useState<any>(null);
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
      const selectedRole = roles.find((role: any) => role.id === data.roleId);
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
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-base sm:text-lg">Gerenciar Funcionários</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={roleOpen} onOpenChange={(open) => {
              setRoleOpen(open);
              if (!open) setEditingRole(null);
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#D4AF37]/20 hover:bg-[#D4AF37]/10 text-sm h-8">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Criar Função</span>
                  <span className="sm:hidden">Função</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRole ? 'Editar Função' : 'Nova Função'}</DialogTitle>
                </DialogHeader>
                <RoleForm 
                  initialData={editingRole}
                  onSuccess={() => {
                    setRoleOpen(false);
                    setEditingRole(null);
                    refreshRoles();
                  }} 
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="text-sm h-8">
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Novo Funcionário</span>
                  <span className="sm:hidden">Funcionário</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Criar Novo Funcionário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-sm">Nome Completo</Label>
                    <Input id="name" {...register("name")} className="h-8 text-sm" />
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input id="email" type="email" {...register("email")} className="h-8 text-sm" />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm">Senha</Label>
                    <Input id="password" type="password" {...register("password")} className="h-8 text-sm" />
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="branchId" className="text-sm">Filial</Label>
                    <Select onValueChange={(value) => setValue("branchId", value)} defaultValue={activeBranch?.id}>
                      <SelectTrigger className="h-8 text-sm">
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
                      <p className="text-xs text-red-500">{errors.branchId.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="roleId" className="text-sm">Função</Label>
                    {roles.length > 0 ? (
                      <>
                        <Select onValueChange={(value) => setValue("roleId", value)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.title} {role.commissionRate > 0 && `(${role.commissionRate}%)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.roleId && (
                          <p className="text-xs text-red-500">{errors.roleId.message}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <Input value="Profissional" disabled className="bg-[#F0F0EB] text-[#737373] h-8 text-sm" />
                        <input type="hidden" {...register("role" as any)} value="PROFESSIONAL" />
                        <p className="text-xs text-[#8B4513] mt-1">
                          ⚠️ Crie funções primeiro ou aguarde implementação do backend
                        </p>
                      </>
                    )}
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full text-sm h-8">
                    {isSubmitting ? "Criando..." : "Criar Funcionário"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs sm:text-sm text-[#737373]">
              Crie contas para seus funcionários. Cada conta criada aqui:
            </p>
            <ul className="mt-2 text-xs sm:text-sm text-[#737373] space-y-1">
              <li>• <strong>Cria usuário:</strong> Login para acessar o sistema</li>
              <li>• <strong>Cria profissional:</strong> Aparece na lista de profissionais</li>
              <li>• <strong>Vincula à filial:</strong> Funcionário fica associado à filial selecionada</li>
              <li>• <strong>Função personalizada:</strong> Título e comissão definidos por você</li>
            </ul>
          </div>
          
          {roles.length > 0 && (
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-[#1A1A1A] mb-2">Funções Disponíveis:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roles.map((role: any) => (
                  <div key={role.id} className="border rounded p-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{role.title}</div>
                        <div className="text-[#737373] space-y-1">
                          <div>{role.commissionRate > 0 ? `${role.commissionRate}% comissão` : 'Sem comissão'}</div>
                          {role.baseSalary && (
                            <div className="text-green-600">
                              Salário: R$ {Number(role.baseSalary).toFixed(2)} (dia {role.salaryPayDay})
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRole(role);
                          setRoleOpen(true);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
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