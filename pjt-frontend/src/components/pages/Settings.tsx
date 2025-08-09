import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Camera, Save, Users } from "lucide-react";
import { EmployeeManagement } from "@/components/custom/EmployeeManagement";
import { BranchManagement } from "@/components/custom/BranchManagement";
import { useUser } from "@/contexts/UserContext";

const userSchema = z.object({
  phone: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function Settings() {
  const queryClient = useQueryClient();
  const { isAdmin } = useUser();

  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await axios.get("/api/auth/profile");
      return res.data;
    },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    values: {
      phone: user?.phone || "",
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      await axios.patch("/api/auth/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const onUserSubmit = (data: UserFormData) => {
    updateUser.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-[#737373]">
          {isAdmin
            ? "Gerencie seu perfil, filiais e funcionários"
            : "Gerencie seus dados pessoais"}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="branches">Filiais</TabsTrigger>
              <TabsTrigger value="employees">Funcionários</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados Editáveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={userForm.handleSubmit(onUserSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...userForm.register("phone")}
                      placeholder="(11) 99999-9999"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Telefone de contato da empresa
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateUser.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateUser.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Dados Fixos
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>Nome:</strong> {user?.name || "Não informado"}
                    </p>
                    <p>
                      <strong>Email:</strong> {user?.email}
                    </p>
                    {isAdmin ? (
                      <p>
                        <strong>Empresa:</strong>{" "}
                        {user?.businessName || "Não informado"}
                      </p>
                    ) : (
                      <p>
                        <strong>Filial:</strong>{" "}
                        {user?.branchName || "Não informado"}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Para alterar estes dados, entre em contato com o{" "}
                    {isAdmin ? "suporte" : "administrador"}.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Foto do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0).toUpperCase() ||
                        user?.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled
                  >
                    <Camera className="h-4 w-4" />
                    Alterar Foto
                  </Button>
                  <p className="text-sm text-[#737373] text-center">
                    Funcionalidade em desenvolvimento
                    <br />
                    Em breve você poderá alterar sua foto
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="branches">
              <BranchManagement />
            </TabsContent>

            <TabsContent value="employees">
              <EmployeeManagement />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
