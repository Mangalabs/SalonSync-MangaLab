import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit, DollarSign } from "lucide-react";
import { ProfessionalForm } from "./ProfessionalForm";
import { ProfessionalCommissionCard } from "./ProfessionalCommissionCard";
import { useState } from "react";
import axios from "@/lib/axios";
import { useBranch } from "@/contexts/BranchContext";

type Professional = {
  id: string;
  name: string;
  role: string;
  roleId?: string;
  commissionRate?: number;
  branchId: string;
  branch?: {
    name: string;
  };
  customRole?: {
    id: string;
    title: string;
    commissionRate: number;
  };
};

export function ProfessionalTable() {
  const queryClient = useQueryClient();
  const [editingProfessional, setEditingProfessional] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const { branches } = useBranch();

  const { data, isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const res = await axios.get("/api/professionals");
      return res.data;
    },
  });

  // Agrupar profissionais por filial
  const professionalsByBranch = branches.reduce((acc, branch) => {
    acc[branch.id] = data?.filter((prof: Professional) => prof.branchId === branch.id) || [];
    return acc;
  }, {} as Record<string, Professional[]>);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {branches.map((branch) => {
          const branchProfessionals = professionalsByBranch[branch.id] || [];
          
          return (
            <div key={branch.id} className="border rounded-md bg-white">
              <div className="border-b p-4">
                <h3 className="text-lg font-semibold text-[#1A1A1A]">{branch.name}</h3>
                <p className="text-sm text-[#737373]">{branchProfessionals.length} profissional(is)</p>
              </div>
              
              {branchProfessionals.length === 0 ? (
                <div className="p-4 text-center text-[#737373]">
                  Nenhum profissional cadastrado nesta filial
                </div>
              ) : (
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2">Nome</th>
                        <th className="py-2">Função</th>
                        <th className="py-2">Comissão</th>
                        <th className="py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchProfessionals.map((prof: Professional) => (
                        <tr 
                          key={prof.id} 
                          className={`border-t cursor-pointer hover:bg-gray-50 ${selectedProfessional === prof.id ? 'bg-[#D4AF37]/10' : ''}`}
                          onClick={() => setSelectedProfessional(prof.id)}
                        >
                          <td className="py-2 font-medium">{prof.name}</td>
                          <td className="py-2">
                            {prof.customRole ? (
                              <span className="text-[#D4AF37] font-medium">
                                {prof.customRole.title}
                              </span>
                            ) : (
                              prof.role || 'N/A'
                            )}
                          </td>
                          <td className="py-2">
                            {prof.customRole ? prof.customRole.commissionRate : (prof.commissionRate || 0)}%
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProfessional(prof);
                                }}
                                className="border-[#D4AF37]/20 hover:bg-[#D4AF37]/10"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteProfessional.mutate(prof.id);
                                }}
                                disabled={deleteProfessional.isPending}
                                className="bg-[#DC2626] hover:bg-[#DC2626]/90"
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
              )}
            </div>
          );
        })}
      </div>
      
      <div>
        {selectedProfessional ? (
          <ProfessionalCommissionCard professionalId={selectedProfessional} />
        ) : (
          <div className="border rounded-md p-6 text-center text-gray-500">
            <DollarSign className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p>Selecione um profissional para ver as comissões</p>
          </div>
        )}
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
