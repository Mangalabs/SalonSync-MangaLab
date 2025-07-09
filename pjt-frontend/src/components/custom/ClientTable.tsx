import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit } from "lucide-react";
import { ClientForm } from "./ClientForm";
import { useState } from "react";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export function ClientTable() {
  const queryClient = useQueryClient();
  const [editingClient, setEditingClient] = useState<any>(null);
  const { activeBranch } = useBranch();

  const { data, isLoading } = useQuery<Client[]>({
    queryKey: ["clients", activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get("/api/clients");
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erro ao excluir cliente");
    },
  });

  if (isLoading) return <p className="p-4">Carregando...</p>;

  return (
    <div>
      <div className="border rounded-md divide-y">
        {data?.map((client) => (
          <div key={client.id} className="p-4 space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-lg">{client.name}</div>
                {client.phone && (
                  <div className="text-sm">Tel: {client.phone}</div>
                )}
                {client.email && (
                  <div className="text-sm">Email: {client.email}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingClient(client)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteClient.mutate(client.id)}
                  disabled={deleteClient.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!editingClient}
        onOpenChange={() => setEditingClient(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            initialData={editingClient}
            onSuccess={() => setEditingClient(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
