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
import { User, Building2, Camera, Save } from "lucide-react";

const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  businessName: z.string().min(2, "Nome do negócio deve ter no mínimo 2 caracteres"),
  phone: z.string().optional(),
});

const branchSchema = z.object({
  name: z.string().min(2, "Nome da filial deve ter no mínimo 2 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;
type BranchFormData = z.infer<typeof branchSchema>;

export default function Settings() {
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await axios.get("/api/auth/profile");
      return res.data;
    },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await axios.get("/api/branches");
      return res.data;
    },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    values: {
      name: user?.name || "",
      email: user?.email || "",
      businessName: user?.businessName || "",
      phone: user?.phone || "",
    },
  });

  const branchForm = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
  });

  const updateUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      await axios.patch("/api/auth/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const updateBranch = useMutation({
    mutationFn: async (data: BranchFormData & { id: string }) => {
      await axios.patch(`/api/branches/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  const onUserSubmit = (data: UserFormData) => {
    updateUser.mutate(data);
  };

  const onBranchSubmit = (data: BranchFormData) => {
    if (selectedBranch) {
      updateBranch.mutate({ ...data, id: selectedBranch });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e filiais</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="branches">Filiais</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    disabled
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold">{user?.name || "Usuário"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload de foto em breve
                  </p>
                </div>
              </div>

              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      {...userForm.register("name")}
                      placeholder="Seu nome completo"
                    />
                    {userForm.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {userForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...userForm.register("email")}
                      placeholder="seu@email.com"
                    />
                    {userForm.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {userForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="businessName">Nome do negócio</Label>
                    <Input
                      id="businessName"
                      {...userForm.register("businessName")}
                      placeholder="Nome do seu negócio"
                    />
                    {userForm.formState.errors.businessName && (
                      <p className="text-sm text-red-500 mt-1">
                        {userForm.formState.errors.businessName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...userForm.register("phone")}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Suas Filiais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {branches.map((branch: any) => (
                    <div
                      key={branch.id}
                      className={`p-3 border rounded-lg cursor-pointer transition ${
                        selectedBranch === branch.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedBranch(branch.id);
                        branchForm.reset({
                          name: branch.name,
                          address: branch.address || "",
                          phone: branch.phone || "",
                        });
                      }}
                    >
                      <h4 className="font-medium">{branch.name}</h4>
                      {branch.address && (
                        <p className="text-sm text-muted-foreground">{branch.address}</p>
                      )}
                      {branch.phone && (
                        <p className="text-sm text-muted-foreground">{branch.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Editar Filial</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBranch ? (
                  <form onSubmit={branchForm.handleSubmit(onBranchSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="branchName">Nome da filial</Label>
                      <Input
                        id="branchName"
                        {...branchForm.register("name")}
                        placeholder="Nome da filial"
                      />
                      {branchForm.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {branchForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="branchAddress">Endereço</Label>
                      <Input
                        id="branchAddress"
                        {...branchForm.register("address")}
                        placeholder="Endereço completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="branchPhone">Telefone</Label>
                      <Input
                        id="branchPhone"
                        {...branchForm.register("phone")}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={updateBranch.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateBranch.isPending ? "Salvando..." : "Salvar Filial"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-muted-foreground">
                    Selecione uma filial para editar
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}