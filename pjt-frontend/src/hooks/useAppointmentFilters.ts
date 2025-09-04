import { useMemo } from 'react'

interface Appointment {
  id: string;
  scheduledAt: string;
  status?: string;
  professional: { name: string };
  client: { name: string };
  appointmentServices: {
    service: { name: string; price: string };
  }[];
  total: string;
}

interface FilterOptions {
  mode?: 'scheduled' | 'completed';
  searchTerm?: string;
  statusFilter?: string;
  dateFilter?: string;
  professionalFilter?: string;
}

export function useAppointmentFilters(appointments: Appointment[], filters: FilterOptions) {
  const { mode, searchTerm = '', statusFilter = 'all', dateFilter = 'all', professionalFilter = 'all' } = filters

  return useMemo(() => {
    // Filtrar por modo
    let filtered = mode === 'completed'
      ? appointments.filter((apt) => apt.status === 'COMPLETED')
      : appointments.filter((apt) => apt.status === 'SCHEDULED')

    // Aplicar filtros apenas quando mode está definido
    if (!mode) {return filtered}

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.professional.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro de status (apenas para agendamentos)
    if (mode === 'scheduled' && statusFilter !== 'all') {
      const now = new Date()
      if (statusFilter === 'overdue') {
        filtered = filtered.filter((apt) => new Date(apt.scheduledAt) < now)
      }
    }

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.scheduledAt)

        switch (dateFilter) {
          case 'today':
            return aptDate.toDateString() === today.toDateString()
          case 'week':
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            return aptDate >= weekStart && aptDate <= weekEnd
          case 'month':
            return (
              aptDate.getMonth() === today.getMonth() &&
              aptDate.getFullYear() === today.getFullYear()
            )
          case 'last-month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
            return aptDate >= lastMonth && aptDate <= lastMonthEnd
          default:
            return true
        }
      })
    }

    // Filtro de profissional
    if (professionalFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.professional.name === professionalFilter)
    }

    return filtered.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )
  }, [appointments, mode, searchTerm, statusFilter, dateFilter, professionalFilter])
}