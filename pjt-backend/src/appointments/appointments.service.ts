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
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'], // Apenas agendamentos ativos geram conflito
        },
      },
    });
    if (existingAppointment) {
      const timeStr = data.scheduledAt.toISOString().substring(11, 16);
      const client = await this.prisma.client.findUnique({
        where: { id: existingAppointment.clientId },
      });
      throw new Error(
        `Já existe um agendamento às ${timeStr} com ${client?.name || 'outro cliente'}`,
      );
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


    const createdAppointment = await this.prisma.appointment.create({
      data: {
        professionalId: data.professionalId,
        clientId: data.clientId,
        branchId,
        total,
        scheduledAt: data.scheduledAt,
        status: (data.status as any) || 'PENDING',
        appointmentServices: {
          create: data.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: {
        professional: {
          include: {
            customRole: true,
          },
        },
        client: true,
        appointmentServices: {
          include: { service: true },
        },
      },
    });

    // Criar transações financeiras se for atendimento imediato (COMPLETED)
    if (createdAppointment.status === 'COMPLETED') {
      await this.prisma.$transaction(async (tx) => {
        await this.createRevenueTransaction(createdAppointment, tx);
        await this.createCommissionTransaction(createdAppointment, tx);
      });
    }

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

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
      },
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

    const targetDate = new Date(date + 'T00:00:00-03:00');
    const startDate = new Date(date + 'T00:00:00-03:00');
    const endDate = new Date(date + 'T23:59:59-03:00');

    // Verificar se as datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return [];
    }

    // Verificar se o profissional está ausente nesta data
    const absence = await this.prisma.professionalAbsence.findFirst({
      where: {
        professionalId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (absence) {
      return [];
    }

    // Verificar dia da semana (0 = Domingo, 1 = Segunda, etc.)
    const dayOfWeek = targetDate.getDay();

    // Buscar configuração de dia de trabalho do profissional
    const workingDay = await this.prisma.professionalWorkingDay.findUnique({
      where: {
        professionalId_dayOfWeek: {
          professionalId,
          dayOfWeek,
        },
      },
    });

    // Se o profissional não trabalha neste dia da semana, retornar vazio
    if (!workingDay || !workingDay.isActive) {
      return [];
    }

    // Gerar horários baseados na configuração do profissional
    const workingHours = this.generateTimeSlots(
      workingDay.startTime,
      workingDay.endTime,
    );

    // Buscar agendamentos existentes para o profissional na data
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'], // Apenas agendamentos ativos ocupam horários
        },
      },
      select: { scheduledAt: true, id: true },
    });

    // Extrair horários ocupados (formato HH:MM) - usar diretamente da string ISO
    const bookedTimes = existingAppointments.map((apt) => {
      const timeStr = apt.scheduledAt.toISOString().substring(11, 16);
      return timeStr;
    });

    // Filtrar horários disponíveis
    const availableSlots = workingHours.filter(
      (time) => !bookedTimes.includes(time),
    );

    return availableSlots;
  }

  private generateTimeSlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Gerar slots de 10 em 10 minutos
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 10) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;

      // Pular horário de almoço (12:00-14:00)
      if (hour >= 12 && hour < 14) {
        continue;
      }

      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeSlot);
    }

    return slots;
  }

  async confirmAppointment(
    id: string,
    newScheduledAt?: Date,
  ): Promise<Appointment> {
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

    // Verificar se o dia do agendamento já chegou
    const now = new Date();
    const appointmentDate = new Date(
      appointment.scheduledAt.toISOString().split('T')[0],
    );
    const today = new Date(now.toISOString().split('T')[0]);

    if (appointmentDate > today) {
      const dateStr = appointment.scheduledAt.toISOString().substring(0, 10);
      throw new Error(
        `Não é possível confirmar agendamento de dia futuro. Agendado para ${dateStr}. Aguarde o dia do agendamento.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Fluxo de status: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
      let newStatus: string;
      if (appointment.status === 'PENDING') {
        newStatus = 'CONFIRMED'; // Cliente chegou
      } else if (appointment.status === 'CONFIRMED') {
        newStatus = 'IN_PROGRESS'; // Atendimento começou
      } else if (appointment.status === 'IN_PROGRESS') {
        newStatus = 'COMPLETED'; // Atendimento finalizado
      } else {
        newStatus = appointment.status; // Manter status atual
      }

      const updateData: any = { status: newStatus };
      if (newScheduledAt) {
        updateData.scheduledAt = newScheduledAt;
      }

      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: updateData,
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

      // Só criar transações quando COMPLETAR o atendimento
      if (newStatus === 'COMPLETED') {
        await this.createRevenueTransaction(updatedAppointment, tx);
        await this.createCommissionTransaction(updatedAppointment, tx);
      }

      return updatedAppointment;
    });
  }

  private async createRevenueTransaction(appointment: any, tx: any) {
    // Verificar se já existe transação para este agendamento
    const existingTransaction = await tx.financialTransaction.findFirst({
      where: {
        appointmentId: appointment.id,
        type: 'INCOME',
      },
    });

    if (existingTransaction) {
      return; // Já existe, não criar duplicata
    }

    // Buscar ou criar categoria de serviços
    let servicesCategory = await tx.expenseCategory.findFirst({
      where: {
        branchId: appointment.branchId,
        name: 'Serviços',
        type: 'INCOME',
      },
    });

    if (!servicesCategory) {
      servicesCategory = await tx.expenseCategory.create({
        data: {
          name: 'Serviços',
          type: 'INCOME',
          color: '#10B981',
          branchId: appointment.branchId,
        },
      });
    }

    // Criar transação de receita
    await tx.financialTransaction.create({
      data: {
        description: `Atendimento: ${appointment.professional.name} - ${appointment.client.name}`,
        amount: Number(appointment.total),
        type: 'INCOME',
        categoryId: servicesCategory.id,
        paymentMethod: 'CASH',
        reference: `Atendimento-${appointment.id}`,
        appointmentId: appointment.id,
        date: appointment.scheduledAt,
        branchId: appointment.branchId,
      },
    });
  }

  private async createCommissionTransaction(appointment: any, tx: any) {
    // Verificar se já existe transação de comissão para este agendamento
    const existingCommission = await tx.financialTransaction.findFirst({
      where: {
        appointmentId: appointment.id,
        type: 'EXPENSE',
      },
    });

    if (existingCommission) {
      return; // Já existe, não criar duplicata
    }

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

  async update(
    id: string,
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
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!existingAppointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar conflito de horário (excluindo o próprio agendamento)
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        professionalId: data.professionalId,
        scheduledAt: data.scheduledAt,
        id: { not: id },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'], // Apenas agendamentos ativos geram conflito
        },
      },
    });
    if (conflictingAppointment) {
      const timeStr = data.scheduledAt.toISOString().substring(11, 16);
      const client = await this.prisma.client.findUnique({
        where: { id: conflictingAppointment.clientId },
      });
      throw new Error(
        `Já existe um agendamento às ${timeStr} com ${client?.name || 'outro cliente'}`,
      );
    }

    const services = await this.prisma.service.findMany({
      where: { id: { in: data.serviceIds } },
      select: { price: true },
    });
    if (services.length !== data.serviceIds.length) {
      throw new NotFoundException('Algum dos serviços não foi encontrado');
    }
    const total = services.reduce((sum, s) => sum + Number(s.price), 0);

    return this.prisma.$transaction(async (tx) => {
      // Remover serviços antigos
      await tx.appointmentService.deleteMany({
        where: { appointmentId: id },
      });

      // Atualizar agendamento
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: {
          professionalId: data.professionalId,
          clientId: data.clientId,
          total,
          scheduledAt: data.scheduledAt,
          status: (data.status as any) || existingAppointment.status,
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

      return updatedAppointment;
    });
  }

  async cancelAppointment(id: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      // Remover transações financeiras se existirem
      await tx.financialTransaction.deleteMany({
        where: { appointmentId: id },
      });

      // Remover serviços do agendamento
      await tx.appointmentService.deleteMany({
        where: { appointmentId: id },
      });

      // Remover agendamento
      await tx.appointment.delete({ where: { id } });
    });
  }

  async fixHistoricalAppointments(): Promise<{
    fixed: number;
    message: string;
  }> {
    // Buscar todos os atendimentos COMPLETED que não têm transações financeiras
    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        professional: {
          include: {
            customRole: true,
          },
        },
        client: true,
        appointmentServices: {
          include: {
            service: true,
          },
        },
      },
    });

    let fixed = 0;

    for (const appointment of completedAppointments) {
      // Verificar se já existe transação financeira para este atendimento
      const existingTransaction =
        await this.prisma.financialTransaction.findFirst({
          where: {
            appointmentId: appointment.id,
          },
        });

      if (existingTransaction) {
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // Criar transação de receita
          await this.createRevenueTransaction(appointment, tx);

          // Criar transação de comissão
          await this.createCommissionTransaction(appointment, tx);
        });

        fixed++;
      } catch {}
    }

    const message = `Correção concluída! ${fixed} atendimentos corrigidos.`;
    return { fixed, message };
  }

  async removeDuplicateTransactions(): Promise<{
    removed: number;
    message: string;
  }> {
    let removed = 0;

    // Buscar todas as transações de atendimentos agrupadas por appointmentId e tipo
    const duplicateGroups = await this.prisma.financialTransaction.groupBy({
      by: ['appointmentId', 'type'],
      where: {
        appointmentId: { not: null },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    for (const group of duplicateGroups) {
      if (group.appointmentId) {
        // Buscar todas as transações duplicadas deste grupo
        const transactions = await this.prisma.financialTransaction.findMany({
          where: {
            appointmentId: group.appointmentId,
            type: group.type,
          },
          orderBy: { createdAt: 'asc' },
        });

        // Manter apenas a primeira, remover as outras
        if (transactions.length > 1) {
          const toRemove = transactions.slice(1);
          for (const transaction of toRemove) {
            await this.prisma.financialTransaction.delete({
              where: { id: transaction.id },
            });
            removed++;
          }
        }
      }
    }

    const message = `Remoção de duplicatas concluída! ${removed} transações duplicadas removidas.`;
    return { removed, message };
  }
}
