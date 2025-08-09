import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Settings, Bell } from "lucide-react";
import { WhatsAppConfig } from "@/components/custom/WhatsAppConfig";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export default function WhatsApp() {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: async () => {
      const response = await api.get("/api/whatsapp/messages");
      return response.data;
    },
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-[#D4AF37]" />
        <h1 className="text-3xl font-bold text-[#1A1A1A]">WhatsApp</h1>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-1 text-sm h-7"
          >
            <Bell className="h-3 w-3" />
            Notificações
          </TabsTrigger>
          <TabsTrigger
            value="config"
            className="flex items-center gap-1 text-sm h-7"
          >
            <Settings className="h-3 w-3" />
            Configuração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Agendamentos via WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-[#737373]">Carregando mensagens...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-[#737373] mx-auto mb-4" />
                  <p className="text-[#737373]">
                    Nenhuma mensagem recebida ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages
                    .filter(
                      (message: any) =>
                        message.direction === "inbound" &&
                        (message.body.toLowerCase().includes("agendamento") ||
                          message.body.toLowerCase().includes("novo") ||
                          message.body.toLowerCase().includes("solicitou"))
                    )
                    .map((message: any) => (
                      <div
                        key={message.id}
                        className="border rounded-lg p-4 bg-blue-50 border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-[#D4AF37]" />
                            <span className="font-medium text-blue-800">
                              📅 Novo Agendamento via WhatsApp
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Recebido
                          </Badge>
                        </div>

                        <div className="text-sm text-[#737373] mb-3">
                          📞 Cliente: {message.from.replace("whatsapp:", "")} •{" "}
                          {new Date(message.createdAt).toLocaleString("pt-BR")}
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <p className="text-sm text-[#1A1A1A] font-medium mb-2">
                            👤 Dados do Agendamento:
                          </p>
                          <p className="text-sm text-[#1A1A1A]">
                            {message.body}
                          </p>
                        </div>

                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs text-yellow-800">
                            ⚠️ Este agendamento foi solicitado via WhatsApp e
                            precisa ser confirmado no sistema.
                          </p>
                        </div>
                      </div>
                    ))}

                  {messages.filter(
                    (message: any) =>
                      message.direction === "inbound" &&
                      !(
                        message.body.toLowerCase().includes("agendamento") ||
                        message.body.toLowerCase().includes("novo") ||
                        message.body.toLowerCase().includes("solicitou")
                      )
                  ).length === 0 &&
                    messages.length > 0 && (
                      <div className="text-center py-4">
                        <p className="text-[#737373] text-sm">
                          Apenas agendamentos completos são exibidos aqui.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <WhatsAppConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
