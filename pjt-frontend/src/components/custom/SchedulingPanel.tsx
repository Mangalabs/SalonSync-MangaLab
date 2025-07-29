import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SchedulingForm } from "./SchedulingForm";
import { Calendar } from "lucide-react";

export function SchedulingPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-white text-primary border border-white hover:bg-gray-100 flex items-center gap-2"
      >
        <Calendar size={16} />
        Novo Agendamento
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo agendamento.
            </DialogDescription>
          </DialogHeader>
          <SchedulingForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}