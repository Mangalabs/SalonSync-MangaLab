import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit } from "lucide-react";
import { ProfessionalForm } from "./ProfessionalForm";
import { useState } from "react";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

type Professional = {
  id: string;
  name: string;
  role: string;
};

export function ProfessionalTable() {
  const queryClient = useQueryClient();
  const [editingProfessional, setEditingProfessional] = useState<any>(null);
  const { activeBranch } = useBranch();

  const { data, isLoading } = useQuery({
    queryKey: ["professionals", activeBranch?.id],
    queryFn: async () => {
      console.log('🔍 Fetching professionals for branch:', activeBranch?.id);
      const res = await axios.get("/api/professionals");
      console.log('🔍 Professionals received:', res.data);
      return res.data;
    },
    enabled: !!activeBranch,
  });

  const deleteProfessional = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/professionals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erro ao excluir profissional");
    },
  });

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div>
      <div className="border rounded-md p-4 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Nome</th>
              <th className="py-2">Função</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((prof: Professional) => (
              <tr key={prof.id} className="border-t">
                <td className="py-2">{prof.name}</td>
                <td className="py-2">{prof.role}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfessional(prof)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProfessional.mutate(prof.id)}
                      disabled={deleteProfessional.isPending}
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
        open={!!editingProfessional}
        onOpenChange={() => setEditingProfessional(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Profissional</DialogTitle>
          </DialogHeader>
          <ProfessionalForm
            initialData={editingProfessional}
            onSuccess={() => setEditingProfessional(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
