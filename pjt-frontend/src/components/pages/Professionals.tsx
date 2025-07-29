import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProfessionalTable } from "@/components/custom/ProfessionalTable";
import { ProfessionalForm } from "@/components/custom/ProfessionalForm";

export default function Professionals() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Profissionais</h1>
          <p className="text-gray-600 text-sm mt-1">
            Para adicionar novos profissionais, acesse <strong>Configurações → Funcionários</strong>
          </p>
        </div>
      </div>

      <ProfessionalTable />
    </div>
  );
}
