import { Controller, Get, Param, Post, Body } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('public')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Get('test')
  test() {
    return { message: 'OK' }
  }

  @Get('debug/users')
  async debugUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        branches: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    return users
  }

  @Get('branch/:branchSlug')
  async getBranchBySlug(@Param('branchSlug') branchSlug: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        name: { contains: branchSlug, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true
          }
        }
      }
    })
    return branch
  }

  @Get('branch/:branchId/services')
  async getBranchServices(@Param('branchId') branchId: string) {
    const services = await this.prisma.service.findMany({
      where: {
        OR: [
          { branchId },
          { branchId: null }
        ]
      },
      select: {
        id: true,
        name: true,
        price: true,
      }
    })
    return services
  }

  @Get('branch/:branchId/professionals')
  async getBranchProfessionals(@Param('branchId') branchId: string) {
    const professionals = await this.prisma.professional.findMany({
      where: { branchId },
      select: {
        id: true,
        name: true,
      }
    })
    return professionals
  }

  @Get('professional/:professionalId/availability/:date')
  async getProfessionalAvailability(
    @Param('professionalId') professionalId: string,
    @Param('date') date: string
  ) {
    // Get existing appointments for the date
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        },
        status: { not: 'CANCELLED' }
      },
      select: {
        scheduledAt: true
      }
    })

    // Generate available times (9:00 to 17:00, hourly intervals)
    const allTimes: string[] = []
    for (let hour = 9; hour < 17; hour++) {
      allTimes.push(`${hour.toString().padStart(2, '0')}:00`)
    }

    // Filter out booked times
    const bookedTimes = existingAppointments.map(apt => {
      const time = new Date(apt.scheduledAt)
      return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
    })

    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time))
    
    return { availableTimes, bookedTimes }
  }

  @Post('appointments')
  async createAppointment(@Body() data: {
    clientName: string
    clientPhone: string
    clientEmail?: string
    serviceId: string
    professionalId: string
    scheduledAt: string
    branchId: string
  }) {
    // Buscar preço do serviço
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
      select: { price: true }
    })
    // Criar ou encontrar cliente
    let client = await this.prisma.client.findFirst({
      where: { 
        phone: data.clientPhone,
        branchId: data.branchId
      }
    })

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          name: data.clientName,
          phone: data.clientPhone,
          email: data.clientEmail,
          branchId: data.branchId
        }
      })
    }

    // Criar agendamento
    const appointment = await this.prisma.appointment.create({
      data: {
        clientId: client.id,
        professionalId: data.professionalId,
        scheduledAt: new Date(data.scheduledAt),
        status: 'SCHEDULED',
        branchId: data.branchId,
        total: service?.price || 0
      },
      include: {
        client: true,
        professional: true
      }
    })

    return appointment
  }
}