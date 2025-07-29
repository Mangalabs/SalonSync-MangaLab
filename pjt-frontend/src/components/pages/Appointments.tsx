import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/custom/AppointmentForm";
import { SchedulingCalendar } from "@/components/custom/SchedulingCalendar";
import { Search, Filter } from "lucide-react";

export default function Appointments() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-[#737373]">Gerencie seus agendamentos futuros</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className=""
        >
          + Novo Agendamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente ou profissional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="overdue">Atrasados</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SchedulingCalendar 
        mode="scheduled" 
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            mode="scheduled"
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}