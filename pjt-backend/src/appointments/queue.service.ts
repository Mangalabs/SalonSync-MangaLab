import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { QueueStatsDto } from './dto/queue-stats.dto'

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async getQueueStats(branchId: string, date: string): Promise<QueueStatsDto[]> {
    if (!branchId) {
      return []
    }
    
    // Criar datas locais para o dia selecionado
    const [year, month, day] = date.split('-').map(Number)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
    // Usar horário local para comparações
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isToday = startOfDay.getTime() === today.getTime()

    try {
      // Buscar profissionais ativos da filial
      const professionals = await this.prisma.professional.findMany({
        where: {
          branchId,
          active: true,
        },
        select: {
          id: true,
          name: true,
        },
      })
      
      const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        client: { select: { name: true } },
        professional: { select: { id: true, name: true } },
        appointmentServices: {
          include: {
            service: { select: { name: true, duration: true } },
          },
        },
      },
        orderBy: { scheduledAt: 'asc' },
      })

      // Calcular estatísticas para cada profissional
      const queueStats: QueueStatsDto[] = await Promise.all(
        professionals.map(async (professional) => {
        const profAppointments = appointments.filter(
          (apt) => apt.professional?.id === professional.id,
        )
        


        // Agendamentos concluídos hoje para estatísticas
        const completedToday = profAppointments.filter(
          (apt) => apt.status === 'COMPLETED',
        ).length

        // Calcular atraso médio (simulado - em produção seria baseado em dados históricos)
        const averageDelay = await this.calculateAverageDelay(professional.id)

        // Calcular eficiência
        const efficiency = await this.calculateEfficiency(professional.id)

        // Encontrar agendamento atual
        const currentAppointment = isToday
          ? profAppointments.find((apt) => {
              if (apt.status !== 'SCHEDULED') return false
              const aptTime = new Date(apt.scheduledAt)
              const duration = apt.appointmentServices[0]?.service?.duration || 30
              const endTime = new Date(aptTime.getTime() + duration * 60000)
              return now >= aptTime && now <= endTime
            })
          : null

        // Agendamentos pendentes - incluir agendamentos atrasados para hoje
        const upcomingAppointments = profAppointments
          .filter((apt) => {
            if (!isToday) return apt.status === 'SCHEDULED'
            // Para hoje, incluir todos os agendamentos SCHEDULED (futuros e atrasados)
            const isScheduled = apt.status === 'SCHEDULED'
            return isScheduled
          })
          .map((apt) => ({
            id: apt.id,
            client: apt.client?.name || 'Cliente',
            service: apt.appointmentServices[0]?.service?.name || 'Serviço',
            scheduledAt: apt.scheduledAt.toISOString(),
            duration: apt.appointmentServices[0]?.service?.duration || 30,
          }))

        // Calcular próxima disponibilidade
        const nextAvailableTimeDate = this.calculateNextAvailableTime(
          currentAppointment,
          upcomingAppointments,
          averageDelay,
          isToday,
          now,
        )
        // Converter para horário local antes de serializar
        const nextAvailableTime = nextAvailableTimeDate ? 
          new Date(nextAvailableTimeDate.getTime() - (nextAvailableTimeDate.getTimezoneOffset() * 60000)).toISOString() : 
          undefined

        // Calcular tempo total de espera
        const totalWaitTime = isToday && nextAvailableTimeDate
          ? Math.max(0, Math.round((nextAvailableTimeDate.getTime() - now.getTime()) / (1000 * 60)))
          : 0

        // Determinar status
        const status = this.getProfessionalStatus(
          currentAppointment,
          upcomingAppointments,
          profAppointments,
          isToday,
        )

          return {
            professionalId: professional.id,
            professionalName: professional.name,
            currentAppointment: currentAppointment
              ? {
                  id: currentAppointment.id,
                  client: currentAppointment.client?.name || 'Cliente',
                  service: currentAppointment.appointmentServices[0]?.service?.name || 'Serviço',
                  scheduledAt: currentAppointment.scheduledAt.toISOString(),
                  duration: currentAppointment.appointmentServices[0]?.service?.duration || 30,
                  estimatedEndTime: new Date(
                    currentAppointment.scheduledAt.getTime() +
                      (currentAppointment.appointmentServices[0]?.service?.duration || 30) * 60000 +
                      averageDelay * 60000,
                  ).toISOString(),
                }
              : undefined,
            upcomingAppointments,
            stats: {
              averageDelay,
              completedToday,
              efficiency,
              totalWaitTime,
            },
            status,
            nextAvailableTime,
          }
        }),
      )

      return queueStats
    } catch (error) {
      return []
    }
  }

  private async calculateAverageDelay(professionalId: string): Promise<number> {
    // Em produção, isso seria baseado em dados históricos reais
    // Por enquanto, simulamos com base no ID do profissional
    const hash = professionalId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    return Math.abs(hash) % 10 - 5 // -5 a +4 minutos
  }

  private async calculateEfficiency(professionalId: string): Promise<number> {
    // Em produção, calcularia % de agendamentos concluídos no prazo
    // Por enquanto, simulamos
    const hash = professionalId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    return Math.abs(hash) % 20 + 80 // 80-99%
  }

  private calculateNextAvailableTime(
    currentAppointment: any,
    upcomingAppointments: any[],
    averageDelay: number,
    isToday: boolean,
    now: Date,
  ): Date | undefined {
    if (!isToday) return undefined

    if (currentAppointment) {
      return new Date(
        currentAppointment.scheduledAt.getTime() +
          currentAppointment.duration * 60000 +
          averageDelay * 60000,
      )
    }

    if (upcomingAppointments.length === 0) {
      // Se não há agendamentos, próximo horário livre é agora
      return now
    }

    // Calcular próxima disponibilidade baseada em todos os agendamentos pendentes
    if (upcomingAppointments.length === 0) {
      return now
    }

    // Ordenar agendamentos por horário
    const sortedAppointments = upcomingAppointments.sort((a, b) => 
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )

    // Começar do horário atual ou do primeiro agendamento, o que for maior
    let estimatedTime = new Date(Math.max(now.getTime(), new Date(sortedAppointments[0].scheduledAt).getTime()))

    // Calcular fim de cada agendamento sequencialmente
    sortedAppointments.forEach((apt) => {
      const aptStart = new Date(apt.scheduledAt)
      // Se o agendamento começa depois do tempo estimado atual, usar o horário do agendamento
      if (aptStart > estimatedTime) {
        estimatedTime = new Date(aptStart.getTime())
      }
      // Adicionar duração do serviço + atraso médio
      estimatedTime = new Date(
        estimatedTime.getTime() + apt.duration * 60000 + averageDelay * 60000
      )
    })

    return estimatedTime
  }

  private getProfessionalStatus(
    currentAppointment: any,
    upcomingAppointments: any[],
    allAppointments: any[],
    isToday: boolean,
  ): 'free' | 'busy' | 'next' | 'overdue' | 'scheduled' {
    if (!isToday) {
      return allAppointments.some(apt => apt.status === 'SCHEDULED') ? 'scheduled' : 'free'
    }

    const now = new Date()
    
    // Verificar se há agendamentos atrasados
    const overdueAppointments = allAppointments.filter(
      apt => apt.status === 'SCHEDULED' && new Date(apt.scheduledAt) < now
    )
    
    // Verificar se há agendamentos futuros
    const futureAppointments = allAppointments.filter(
      apt => apt.status === 'SCHEDULED' && new Date(apt.scheduledAt) > now
    )

    if (currentAppointment) return 'busy'
    if (overdueAppointments.length > 0) return 'overdue'
    if (futureAppointments.length > 0) return 'next'
    return 'free'
  }
}