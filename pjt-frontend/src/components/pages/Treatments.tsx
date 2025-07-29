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

export default function Treatments() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [professionalFilter, setProfessionalFilter] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Atendimentos</h1>
          <p className="text-[#737373]">Histórico de atendimentos realizados</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-accent text-[#8B4513]-foreground hover:bg-accent/90"
        >
          + Novo Atendimento
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
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="last-month">Mês passado</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os profissionais</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-[#D4AF37]">-</div>
          <div className="text-sm text-gray-600">Total de Atendimentos</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">R$ -</div>
          <div className="text-sm text-gray-600">Receita Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">R$ -</div>
          <div className="text-sm text-gray-600">Ticket Médio</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">-</div>
          <div className="text-sm text-gray-600">Profissional Top</div>
        </div>
      </div>

      <SchedulingCalendar 
        mode="completed" 
        searchTerm={searchTerm}
        dateFilter={dateFilter}
        professionalFilter={professionalFilter}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Atendimento</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            mode="immediate"
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}