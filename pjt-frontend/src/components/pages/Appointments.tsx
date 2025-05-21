import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/custom/AppointmentForm";
import { AppointmentTable } from "@/components/custom/AppointmentTable";

export default function Appointments() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "true") setOpen(true);
  }, [searchParams]);

  const handleClose = () => {
    setOpen(false);
    navigate("/dashboard/appointments");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Atendimentos</h1>
      <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
        <DialogContent aria-describedby="appointment-modal-description">
          <DialogHeader>
            <DialogTitle>Novo Atendimento</DialogTitle>
            <DialogDescription id="appointment-modal-description">
              Preencha os dados abaixo para finalizar o atendimento.
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm onSuccess={handleClose} />
        </DialogContent>
      </Dialog>
      <AppointmentTable />
    </div>
  );
}
