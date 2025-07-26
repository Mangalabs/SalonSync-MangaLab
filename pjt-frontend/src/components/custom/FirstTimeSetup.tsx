import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, Building2, User } from "lucide-react";

const setupSchema = z.object({
  businessName: z.string().min(2, "Nome do negócio deve ter no mínimo 2 caracteres"),
  phone: z.string().optional(),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface FirstTimeSetupProps {
  onComplete: () => void;
}

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [step, setStep] = useState(1);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  });

  const updateProfile = useMutation({
    mutationFn: async (data: SetupFormData) => {
      await axios.patch("/api/auth/profile", data);
    },
    onSuccess: () => {
      toast.success("Configuração inicial concluída!");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      onComplete();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao salvar configurações");
    },
  });

  const onSubmit = (data: SetupFormData) => {
    updateProfile.mutate(data);
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#FF5D73] rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#FF5D73]">
              Bem-vindo ao Sistema!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Vamos configurar sua conta em alguns passos simples
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium text-blue-900">Configuração Inicial</div>
                  <div className="text-sm text-blue-700">Dados básicos do seu negócio</div>
                </div>
              </div>
              
              <Button 
                onClick={() => setStep(2)} 
                className="w-full bg-[#FF5D73] text-white"
              >
                Começar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#FF5D73] rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">
            Configuração Inicial
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Complete os dados do seu negócio
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="businessName">Nome do Negócio</Label>
              <Input 
                id="businessName" 
                {...register("businessName")} 
                placeholder="Ex: Barbearia do João"
              />
              {errors.businessName && (
                <p className="text-sm text-red-500">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone (Opcional)</Label>
              <Input 
                id="phone" 
                {...register("phone")} 
                placeholder="(11) 99999-9999"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-[#FF5D73] text-white"
            >
              {isSubmitting ? "Salvando..." : "Concluir Configuração"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}