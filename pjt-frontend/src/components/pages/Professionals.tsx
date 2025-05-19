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
        <h1 className="text-2xl font-bold">Profissionais</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF5D73] text-white">
              + Novo profissional
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo profissional</DialogTitle>
            </DialogHeader>
            <ProfessionalForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <ProfessionalTable />
    </div>
  );
}
