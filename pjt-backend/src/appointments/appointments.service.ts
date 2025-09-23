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
          in: ['SCHEDULED', 'COMPLETED'], // Considerar apenas agendamentos ativos
        },
      },
      include: {
        client: { select: { name: true } },
      },
    });
    if (existingAppointment) {
      const localTime = new Date(data.scheduledAt.getTime() - (3 * 60 * 60 * 1000));
      const timeStr = localTime.toISOString().substring(11, 16);
      console.log('⚠️ CONFLICT: Appointment already exists at this time:', {
        existing: existingAppointment.id,
        client: existingAppointment.client?.name,
        scheduledAt: data.scheduledAt.toISOString(),
        localTime: timeStr,
      });
      throw new Error(`Já existe um agendamento às ${timeStr} com ${existingAppointment.client?.name || 'outro cliente'}`);
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

    // Só gerar transações financeiras se for atendimento imediato (COMPLETED)
    if (createdAppointment.status === 'COMPLETED') {
      await this.prisma.$transaction(async (tx) => {
        await this.createRevenueTransaction(createdAppointment, tx);
        await this.createCommissionTransaction(createdAppointment, tx);
      });
    }

    console.log('✅ Appointment created successfully:', {
      id: createdAppointment.id,
      professionalId: createdAppointment.professionalId,
      status: createdAppointment.status,
      branchId: createdAppointment.branchId,
      generatedTransactions: createdAppointment.status === 'COMPLETED',
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
        professional: apt.professional?.name || 'Profissional removido',
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
      console.log(`❌ Professional ${professionalId} is absent on ${date}:`, {
        reason: absence.reason,
        type: absence.type,
      });
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
      console.log(`❌ Professional ${professionalId} does not work on day ${dayOfWeek} (${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek]})`);
      return [];
    }

    // Gerar horários baseados na configuração do profissional
    const workingHours = this.generateTimeSlots(workingDay.startTime, workingDay.endTime);

    // Buscar agendamentos existentes para o profissional na data
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['SCHEDULED', 'COMPLETED'], // Considerar agendados e concluídos como ocupados
        },
      },
      select: { scheduledAt: true, id: true },
    });

    console.log(`🕐 Checking available slots for professional ${professionalId} on ${date}:`, {
      dayOfWeek,
      workingDay: workingDay ? `${workingDay.startTime}-${workingDay.endTime}` : 'default',
      existingAppointments: existingAppointments.map(apt => ({
        id: apt.id.substring(0, 8),
        time: apt.scheduledAt.toISOString().substring(11, 16)
      }))
    });
    
    // Extrair horários ocupados (formato HH:MM) - converter para horário local
    const bookedTimes = existingAppointments.map((apt) => {
      const localTime = new Date(apt.scheduledAt.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
      const timeStr = localTime.toISOString().substring(11, 16);
      return timeStr;
    });

    // Filtrar horários disponíveis
    const availableSlots = workingHours.filter((time) => !bookedTimes.includes(time));
    
    console.log(`✅ Available slots for ${professionalId} on ${date}:`, {
      workingHours,
      bookedTimes,
      availableSlots
    });

    return availableSlots;
  }

  private generateTimeSlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Gerar slots de 60 em 60 minutos
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
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

      // Criar transação de receita
      await this.createRevenueTransaction(updatedAppointment, tx);
      
      // Criar transação de comissão
      await this.createCommissionTransaction(updatedAppointment, tx);

      return updatedAppointment;
    });
  }

  private async createRevenueTransaction(appointment: any, tx: any) {
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
          in: ['SCHEDULED', 'COMPLETED'], // Considerar apenas agendamentos ativos
        },
      },
      include: {
        client: { select: { name: true } },
      },
    });
    if (conflictingAppointment) {
      const localTime = new Date(data.scheduledAt.getTime() - (3 * 60 * 60 * 1000));
      const timeStr = localTime.toISOString().substring(11, 16);
      throw new Error(`Já existe um agendamento às ${timeStr} com ${conflictingAppointment.client?.name || 'outro cliente'}`);
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

    console.log('✅ Appointment cancelled and transactions removed:', { id: id.substring(0, 8) });
  }

  async fixHistoricalAppointments(): Promise<{ fixed: number; message: string }> {
    console.log('🔧 Iniciando correção de atendimentos históricos...');

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

    console.log(`📊 Encontrados ${completedAppointments.length} atendimentos concluídos`);

    let fixed = 0;

    for (const appointment of completedAppointments) {
      // Verificar se já existe transação financeira para este atendimento
      const existingTransaction = await this.prisma.financialTransaction.findFirst({
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
        console.log(`✅ Atendimento ${appointment.id.substring(0, 8)} corrigido`);
      } catch (error) {
        console.error(`❌ Erro ao corrigir atendimento ${appointment.id.substring(0, 8)}:`, error);
      }
    }

    const message = `Correção concluída! ${fixed} atendimentos corrigidos.`;
    console.log(`🎉 ${message}`);
    
    return { fixed, message };
  }
}
