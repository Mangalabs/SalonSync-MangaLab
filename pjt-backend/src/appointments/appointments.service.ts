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
      console.log('⚠️ CONFLICT: Appointment already exists at this time:', {
        existing: existingAppointment.id,
        scheduledAt: data.scheduledAt.toISOString(),
      });
      throw new Error('Já existe um agendamento neste horário');
    }

    console.log('✅ No conflict, creating appointment:', {
      professionalId: data.professionalId,
      scheduledAt: data.scheduledAt.toISOString(),
      status: data.status,
    });

    const services = await this.prisma.service.findMany({
      where: { id: { in: data.serviceIds } },
      select: { price: true },
    });
    if (services.length !== data.serviceIds.length) {
      throw new NotFoundException('Algum dos serviços não foi encontrado');
    }
    const total = services.reduce((sum, s) => sum + Number(s.price), 0);

    const branchId = await this.getTargetBranchId(user, targetBranchId);

    console.log('🔍 Backend creating appointment:', {
      professionalId: data.professionalId,
      clientId: data.clientId,
      branchId,
      status: data.status,
      scheduledAt: data.scheduledAt.toISOString(),
      serviceIds: data.serviceIds,
    });

    const createdAppointment = await this.prisma.appointment.create({
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

    console.log('✅ Appointment created successfully:', {
      id: createdAppointment.id,
      professionalId: createdAppointment.professionalId,
      status: createdAppointment.status,
      branchId: createdAppointment.branchId,
    });

    return createdAppointment;
  }

  async findAll(
    user: UserContext,
    filters?: {
      professionalId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Appointment[]> {
    const branchIds = await this.getUserBranchIds(user);

    const where: any = { branchId: { in: branchIds } };

    if (filters?.professionalId) {
      where.professionalId = filters.professionalId;
    }

    if (filters?.startDate && filters?.endDate) {
      where.scheduledAt = {
        gte: new Date(filters.startDate + 'T00:00:00'),
        lte: new Date(filters.endDate + 'T23:59:59'),
      };
    }

    console.log('🔍 AppointmentsService.findAll with filters:', {
      user: user.id,
      branchIds,
      filters,
      where,
    });

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
      },
    });

    console.log('📊 AppointmentsService.findAll result:', {
      count: appointments.length,
      appointments: appointments.map((apt) => ({
        id: apt.id.substring(0, 8),
        professional: apt.professional.name,
        status: apt.status,
        scheduledAt: apt.scheduledAt.toISOString(),
      })),
    });

    return appointments;
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
    // Validar parâmetros
    if (
      !professionalId ||
      professionalId === 'undefined' ||
      !date ||
      date === 'undefined'
    ) {
      return [];
    }

    // Validar formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return [];
    }

    const startDate = new Date(date + 'T00:00:00Z');
    const endDate = new Date(date + 'T23:59:59Z');

    // Verificar se as datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return [];
    }

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
      include: {
        professional: {
          include: {
            customRole: true,
          },
        },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      // Atualizar status do appointment
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: {
          professional: {
            include: {
              customRole: true,
            },
          },
          client: true,
          appointmentServices: { include: { service: true } },
        },
      });

      // Criar transação de comissão
      await this.createCommissionTransaction(updatedAppointment, tx);

      return updatedAppointment;
    });
  }

  private async createCommissionTransaction(appointment: any, tx: any) {
    // Calcular comissão
    const commissionRate =
      appointment.professional.customRole?.commissionRate ||
      appointment.professional.commissionRate ||
      0;
    const commissionAmount =
      (Number(appointment.total) * Number(commissionRate)) / 100;

    if (commissionAmount <= 0) return;

    // Buscar ou criar categoria de comissão
    let commissionCategory = await tx.expenseCategory.findFirst({
      where: {
        branchId: appointment.branchId,
        name: 'Comissões',
        type: 'EXPENSE',
      },
    });

    if (!commissionCategory) {
      commissionCategory = await tx.expenseCategory.create({
        data: {
          name: 'Comissões',
          type: 'EXPENSE',
          color: '#8B5CF6',
          branchId: appointment.branchId,
        },
      });
    }

    // Criar transação de comissão
    await tx.financialTransaction.create({
      data: {
        description: `Comissão: ${appointment.professional.name} - ${appointment.client.name}`,
        amount: commissionAmount,
        type: 'EXPENSE',
        categoryId: commissionCategory.id,
        paymentMethod: 'OTHER',
        reference: `Atendimento-${appointment.id}`,
        appointmentId: appointment.id,
        date: appointment.scheduledAt,
        branchId: appointment.branchId,
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
