import { useState } from 'react'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

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
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

export default function Appointments() {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [professionalFilter, setProfessionalFilter] = useState('all')
  const { activeBranch } = useBranch()

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/professionals')
      return res.data
    },
    enabled: !!activeBranch,
  })

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Agendamentos</h1>
          <p className="text-xs sm:text-sm text-[#737373]">
            Gerencie seus agendamentos futuros
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="text-sm h-8 sm:h-10"
        >
          <span className="hidden sm:inline">+ Novo Agendamento</span>
          <span className="sm:hidden">+ Agendar</span>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-24 sm:w-32 h-8 text-xs sm:text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
                <SelectItem value="overdue">Atrasados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-24 sm:w-32 h-8 text-xs sm:text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={professionalFilter}
              onValueChange={setProfessionalFilter}
            >
              <SelectTrigger className="w-28 sm:w-36 h-8 text-xs sm:text-sm">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {professionals.map((prof: any) => (
                  <SelectItem key={prof.id} value={prof.name}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <SchedulingCalendar
        mode="scheduled"
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        professionalFilter={professionalFilter}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            mode="scheduled"
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
