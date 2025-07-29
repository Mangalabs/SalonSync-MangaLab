import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Appointment } from '@prisma/client';
import {
  BaseDataService,
  UserContext,
} from '@/common/services/base-data.service';

@Injectable()
export class AppointmentsService extends BaseDataService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    data: {
      professionalId: string;
      clientId: string;
      serviceIds: string[];
      scheduledAt: Date;
      status?: string;
    },
    user: UserContext,
    targetBranchId?: string,
  ): Promise<Appointment> {
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

    const branchId = await this.getTargetBranchId(user, targetBranchId);

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

  async findAll(user: UserContext): Promise<Appointment[]> {
    const branchIds = await this.getUserBranchIds(user);

    return this.prisma.appointment.findMany({
      where: { branchId: { in: branchIds } },
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

  async getAvailableSlots(
    professionalId: string,
    date: string,
  ): Promise<string[]> {
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

    const workingHours = [
      '09:00',
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ];
    const bookedTimes = existingAppointments.map((apt) =>
      apt.scheduledAt.toISOString().substring(11, 16),
    );

    return workingHours.filter((time) => !bookedTimes.includes(time));
  }

  async confirmAppointment(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
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
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await this.prisma.appointmentService.deleteMany({
      where: { appointmentId: id },
    });
    await this.prisma.appointment.delete({ where: { id } });
  }
}
