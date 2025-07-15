import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentForm } from "@/components/custom/AppointmentForm";
import { AppointmentTable } from "@/components/custom/AppointmentTable";

export default function Scheduling() {
  const [scheduledOpen, setScheduledOpen] = useState(false);
  const [immediateOpen, setImmediateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <div className="flex gap-2">
          <Dialog open={scheduledOpen} onOpenChange={setScheduledOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3b82f6] text-white">+ Agendar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Agende um atendimento para uma data futura.
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm mode="scheduled" onSuccess={() => setScheduledOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={immediateOpen} onOpenChange={setImmediateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#10b981] text-white">+ Atendimento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Atendimento</DialogTitle>
                <DialogDescription>
                  Registre um atendimento que foi realizado agora.
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm mode="immediate" onSuccess={() => setImmediateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="scheduled">
        <TabsList>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="completed">Realizados</TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled" className="mt-4">
          <AppointmentTable filter="SCHEDULED" />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <AppointmentTable filter="COMPLETED" />
        </TabsContent>
      </Tabs>
    </div>
  );
}