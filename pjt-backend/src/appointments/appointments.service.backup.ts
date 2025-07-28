import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Appointment } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    professionalId: string;
    clientId: string;
    serviceIds: string[];
    scheduledAt: Date;
    status?: string;
    userId?: string;
    branchId?: string;
  }): Promise<Appointment> {
    // Verificar conflito de horário
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        professionalId: data.professionalId,
        scheduledAt: data.scheduledAt,
      },
    });
    if (existingAppointment) {
      throw new Error('Já existe um agendamento neste horário');
    }

    const services = await this.prisma.service.findMany({
      where: { id: { in: data.serviceIds } },
      select: { price: true },
    });
    if (services.length !== data.serviceIds.length) {
      throw new NotFoundException('Algum dos serviços não foi encontrado');
    }
    const total = services.reduce((sum, s) => sum + Number(s.price), 0);

    let branchId: string;
    
    if (data.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: data.branchId }
      });
      if (!branch) {
        throw new Error('Filial não encontrada');
      }
      branchId = data.branchId;
    } else if (data.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { role: true, name: true }
      });
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      if (user.role === 'ADMIN') {
        const userBranches = await this.prisma.branch.findMany({
          where: { ownerId: data.userId }
        });
        
        if (userBranches.length === 0) {
          throw new Error('Nenhuma filial encontrada para este usuário.');
        }
        branchId = userBranches[0].id;
      } else {
        if (!user.name) {
          throw new Error('Nome do usuário não encontrado');
        }
        
        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          select: { branchId: true }
        });
        
        if (!professional) {
          throw new Error('Profissional não encontrado no sistema.');
        }
        
        branchId = professional.branchId;
      }
    } else {
      const firstBranch = await this.prisma.branch.findFirst();
      if (!firstBranch) throw new Error('Nenhuma filial encontrada');
      branchId = firstBranch.id;
    }

    console.log('Creating appointment with data:', {
      professionalId: data.professionalId,
      clientId: data.clientId,
      branchId,
      total,
      scheduledAt: data.scheduledAt,
      status: data.status || 'SCHEDULED'
    }); // Debug log
    
    // Verificar se o profissional existe
    const professional = await this.prisma.professional.findUnique({
      where: { id: data.professionalId }
    });
    
    if (!professional) {
      throw new Error(`Profissional com ID ${data.professionalId} não encontrado`);
    }
    
    console.log('Professional found:', professional); // Debug log
    
    return this.prisma.appointment.create({
      data: {
        professionalId: data.professionalId,
        clientId: data.clientId,
        branchId,
        total,
        scheduledAt: data.scheduledAt,
        status: (data.status as any) || 'SCHEDULED',
        appointmentServices: {
          create: data.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: {
        professional: true,
        client: true,
        appointmentServices: {
          include: { service: true },
        },
      },
    });
  }

  async findAll(userId?: string, branchId?: string): Promise<Appointment[]> {
    if (branchId) {
      return this.prisma.appointment.findMany({
        where: { branchId },
        orderBy: { createdAt: 'desc' },
        include: {
          professional: true,
          client: true,
          appointmentServices: { include: { service: true } },
        },
      });
    }
    
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true }
      });
      
      if (!user) {
        return [];
      }
      
      if (user.role === 'ADMIN') {
        const userBranches = await this.prisma.branch.findMany({
          where: { ownerId: userId },
          select: { id: true }
        });
        const branchIds = userBranches.map(b => b.id);
        
        return this.prisma.appointment.findMany({
          where: { branchId: { in: branchIds } },
          orderBy: { createdAt: 'desc' },
          include: {
            professional: true,
            client: true,
            appointmentServices: { include: { service: true } },
          },
        });
      } else {
        if (!user.name) {
          return [];
        }
        
        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          select: { branchId: true }
        });
        
        if (!professional) {
          return [];
        }
        
        return this.prisma.appointment.findMany({
          where: { branchId: professional.branchId },
          orderBy: { createdAt: 'desc' },
          include: {
            professional: true,
            client: true,
            appointmentServices: { include: { service: true } },
          },
        });
      }
    }
    
    return this.prisma.appointment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
      },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
      },
    });
    if (!appt) throw new NotFoundException('Atendimento não encontrado');
    return appt;
  }

  async getAvailableSlots(professionalId: string, date: string): Promise<string[]> {
    const startDate = new Date(date + 'T00:00:00Z');
    const endDate = new Date(date + 'T23:59:59Z');
    
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { scheduledAt: true },
    });

    const workingHours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    const bookedTimes = existingAppointments.map(apt => 
      apt.scheduledAt.toISOString().substring(11, 16)
    );

    return workingHours.filter(time => !bookedTimes.includes(time));
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const startDate = new Date(date + 'T00:00:00Z');
    const endDate = new Date(date + 'T23:59:59Z');

    return this.prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    
    // Excluir primeiro os serviços do agendamento
    await this.prisma.appointmentService.deleteMany({
      where: { appointmentId: id }
    });
    
    // Depois excluir o agendamento
    await this.prisma.appointment.delete({ where: { id } });
  }

  async confirmAppointment(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    
    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
      },
    });
  }

  async cancelAppointment(id: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    
    // Cancelar = excluir o agendamento
    await this.prisma.appointmentService.deleteMany({
      where: { appointmentId: id }
    });
    await this.prisma.appointment.delete({ where: { id } });
  }
}
