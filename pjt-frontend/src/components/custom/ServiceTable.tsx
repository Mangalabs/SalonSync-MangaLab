import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit } from "lucide-react";
import { ServiceForm } from "./ServiceForm";
import { useState } from "react";
import axios from "axios";

export function ServiceTable() {
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await axios.get("/api/services");
      return res.data;
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erro ao excluir serviço");
    },
  });

  if (isLoading) return <p>Carregando serviços...</p>;
  if (!Array.isArray(data)) return <p>Nenhum serviço encontrado.</p>;

  return (
    <div>
      <div className="border rounded-md p-4 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Nome</th>
              <th className="py-2">Preço</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((service: any) => (
              <tr key={service.id} className="border-t">
                <td className="py-2">{service.name}</td>
                <td className="py-2">R$ {Number(service.price).toFixed(2)}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingService(service)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteService.mutate(service.id)}
                      disabled={deleteService.isPending}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!editingService}
        onOpenChange={() => setEditingService(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          <ServiceForm
            initialData={editingService}
            onSuccess={() => setEditingService(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
