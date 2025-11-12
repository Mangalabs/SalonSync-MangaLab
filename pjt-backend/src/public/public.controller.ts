import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Get('test')
  test() {
    return { message: 'OK' };
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
            name: true,
          },
        },
      },
    });
    return users;
  }

  @Get('debug/branches')
  async debugBranches() {
    const branches = await this.prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
      },
    });
    return branches;
  }

  @Get('debug/appointments')
  async debugAppointments() {
    const appointments = await this.prisma.appointment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        client: true,
        professional: true,
        appointmentServices: {
          include: {
            service: true,
          },
        },
      },
    });
    return appointments;
  }

  @Get('debug/appointments/:date')
  async debugAppointmentsByDate(@Param('date') date: string) {
    const startDate = new Date(date + 'T00:00:00');
    const endDate = new Date(date + 'T23:59:59');
    
    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: true,
        professional: true,
        appointmentServices: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return appointments;
  }

  @Post('debug/date-test')
  async debugDateTest(@Body() data: { scheduledAt: string }) {
    const receivedDate = data.scheduledAt;
    const processedDate = new Date(data.scheduledAt);
    
    return {
      received: receivedDate,
      processed: processedDate.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: processedDate.getTimezoneOffset(),
    };
  }

  @Get('branch/:branchSlug')
  async getBranchBySlug(@Param('branchSlug') branchSlug: string) {
    const decodedSlug = decodeURIComponent(branchSlug);
    const branch = await this.prisma.branch.findFirst({
      where: {
        OR: [
          { name: { equals: decodedSlug, mode: 'insensitive' } },
          { name: { contains: decodedSlug, mode: 'insensitive' } },
        ],
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
            businessName: true,
          },
        },
      },
    });
    
    if (!branch) {
      // Para debug, vamos listar as filiais disponíveis
      const availableBranches = await this.prisma.branch.findMany({
        select: { name: true },
      });
      throw new Error(`Filial '${decodedSlug}' não encontrada. Filiais disponíveis: ${availableBranches.map(b => b.name).join(', ')}`);
    }
    
    return branch;
  }

  @Get('branch/:branchId/services')
  async getBranchServices(@Param('branchId') branchId: string) {
    const services = await this.prisma.service.findMany({
      where: {
        OR: [{ branchId }, { branchId: null }],
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });
    return services;
  }

  @Get('branch/:branchId/professionals')
  async getBranchProfessionals(@Param('branchId') branchId: string) {
    const professionals = await this.prisma.professional.findMany({
      where: { branchId },
      select: {
        id: true,
        name: true,
      },
    });
    return professionals;
  }

  @Get('professional/:professionalId/availability/:date')
  async getProfessionalAvailability(
    @Param('professionalId') professionalId: string,
    @Param('date') date: string,
  ) {
    // Get existing appointments for the date
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: new Date(date + 'T00:00:00-03:00'),
          lt: new Date(date + 'T23:59:59-03:00'),
        },
        status: { not: 'CANCELLED' },
      },
      select: {
        scheduledAt: true,
      },
    });

    // Generate available times (9:00 to 17:00, 10-minute intervals)
    const allTimes: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        // Skip lunch time (12:00-14:00)
        if (hour >= 12 && hour < 14) {
          continue;
        }
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allTimes.push(time);
      }
    }

    // Filter out booked times
    const bookedTimes = existingAppointments.map((apt) => {
      const time = new Date(apt.scheduledAt);
      return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    });

    const availableTimes = allTimes.filter(
      (time) => !bookedTimes.includes(time),
    );

    return { availableTimes, bookedTimes };
  }

  @Post('appointments')
  async createAppointment(
    @Body()
    data: {
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      serviceId: string;
      professionalId: string;
      scheduledAt: string;
      branchId: string;
    },
  ) {
    // Buscar preço do serviço
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
      select: { price: true },
    });
    
    // Criar ou encontrar cliente
    let client = await this.prisma.client.findFirst({
      where: {
        phone: data.clientPhone,
        branchId: data.branchId,
      },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          name: data.clientName,
          phone: data.clientPhone,
          email: data.clientEmail,
          branchId: data.branchId,
        },
      });
    }

    // Criar agendamento com appointmentServices
    const appointment = await this.prisma.appointment.create({
      data: {
        clientId: client.id,
        professionalId: data.professionalId,
        scheduledAt: new Date(data.scheduledAt),
        status: 'PENDING',
        branchId: data.branchId,
        total: service?.price || 0,
        appointmentServices: {
          create: {
            serviceId: data.serviceId,
          },
        },
      },
      include: {
        client: true,
        professional: true,
        appointmentServices: {
          include: {
            service: true,
          },
        },
      },
    });

    return appointment;
  }
}
