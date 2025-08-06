import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, CheckCircle, AlertCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";

const configSchema = z.object({
  accountSid: z.string().min(1, "Account SID é obrigatório"),
  authToken: z.string().min(1, "Auth Token é obrigatório"),
  whatsappNumber: z.string().min(10, "Número WhatsApp é obrigatório"),
});

type ConfigFormData = z.infer<typeof configSchema>;

export function WhatsAppConfig() {
  const [showToken, setShowToken] = useState(false);
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      const response = await api.get('/api/whatsapp/config');
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
  });

  const saveConfig = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      const response = await api.post('/api/whatsapp/config', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Configuração salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      reset();
    },
    onError: () => {
      toast.error("Erro ao salvar configuração");
    },
  });

  const testMessage = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/whatsapp/test');
      return response.data;
    },
    onSuccess: () => {
      toast.success("Mensagem de teste enviada!");
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem de teste");
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    saveConfig.mutate(data);
  };

  if (configLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      {config?.configured && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-700">WhatsApp Configurado</p>
                <p className="text-sm text-[#737373]">
                  Número: {config.whatsappNumber}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testMessage.mutate()}
                  disabled={testMessage.isPending}
                  className="text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A1A1A]"
                >
                  {testMessage.isPending ? "Enviando..." : "Testar"}
                </Button>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Ativo
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração Twilio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="accountSid">Account SID</Label>
            <Input
              id="accountSid"
              {...register("accountSid")}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="font-mono text-sm"
            />
            {errors.accountSid && (
              <p className="text-sm text-red-500 mt-1">{errors.accountSid.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="authToken">Auth Token</Label>
            <div className="relative">
              <Input
                id="authToken"
                type={showToken ? "text" : "password"}
                {...register("authToken")}
                placeholder="••••••••••••••••••••••••••••••••"
                className="font-mono text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.authToken && (
              <p className="text-sm text-red-500 mt-1">{errors.authToken.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="whatsappNumber">Número WhatsApp</Label>
            <Input
              id="whatsappNumber"
              {...register("whatsappNumber")}
              placeholder="+5511999999999"
              className="font-mono text-sm"
            />
            {errors.whatsappNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.whatsappNumber.message}</p>
            )}
            <p className="text-xs text-[#737373] mt-1">
              Número aprovado para WhatsApp Business API no Twilio
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={saveConfig.isPending} 
            className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A]"
          >
            {saveConfig.isPending ? "Salvando..." : config?.configured ? "Atualizar Configuração" : "Salvar Configuração"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Como configurar:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Acesse o Console do Twilio</li>
            <li>2. Copie o Account SID e Auth Token</li>
            <li>3. Configure um número para WhatsApp Business</li>
            <li>4. Cole as informações acima</li>
          </ol>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}