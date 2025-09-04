import { useState } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppointmentForm } from '@/components/custom/AppointmentForm'
import { SchedulingCalendar } from '@/components/custom/SchedulingCalendar'

export default function Treatments() {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [professionalFilter, setProfessionalFilter] = useState('all')

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Atendimentos</h1>
          <p className="text-xs sm:text-sm text-[#737373]">
            Histórico de atendimentos realizados
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#8B4513] text-white hover:bg-[#7A3E11] text-sm h-8 sm:h-10"
        >
          <span className="hidden sm:inline">+ Novo Atendimento</span>
          <span className="sm:hidden">+ Atender</span>
        </Button>
      </div>

      <div className="bg-white p-3 md:p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 h-8 text-sm"
            />
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-24 sm:w-32 h-8 text-xs sm:text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="last-month">Mês passado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={professionalFilter}
              onValueChange={setProfessionalFilter}
            >
              <SelectTrigger className="w-24 sm:w-32 h-8 text-xs sm:text-sm">
                <SelectValue placeholder="Prof." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <SchedulingCalendar
        mode="completed"
        searchTerm={searchTerm}
        dateFilter={dateFilter}
        professionalFilter={professionalFilter}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Novo Atendimento
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            mode="immediate"
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
