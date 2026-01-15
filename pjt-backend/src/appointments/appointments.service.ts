import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Appointment } from '@prisma/client';
import {
  BaseDataService,
  UserContext,
} from '@/common/services/base-data.service';
import { DateTime } from '@/utils/dateTime';
import { ScheduleBlocksService } from '@/schedule-blocks/schedule-blocks.service';

@Injectable()
export class AppointmentsService extends BaseDataService {
  constructor(
    prisma: PrismaService,
    private readonly scheduleBlocksService: ScheduleBlocksService,
  ) {
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
      const timeStr = DateTime.extractTime(data.scheduledAt);
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
        appointmentProducts: { include: { product: true } },
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

    // Usar DateTime para criar datas no timezone correto (America/Sao_Paulo)
    const startDate = DateTime.createStartOfDay(date);
    const endDate = DateTime.createEndOfDay(date);

    // Verificar se as datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return [];
    }

    // Obter dia da semana no timezone do sistema
    const dayOfWeek = DateTime.getDayOfWeek(date);

    // Buscar profissional para obter branchId
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      select: { branchId: true },
    });

    if (!professional) {
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

    // Buscar configuração de horário da filial para este dia
    const branchHours = await this.prisma.branchHours.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId: professional.branchId,
          dayOfWeek,
        },
      },
    });

    // Se a filial não abre neste dia, retornar vazio
    if (!branchHours || !branchHours.isOpen) {
      return [];
    }

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

    // Gerar horários baseados na configuração da filial e profissional
    // Usar o intervalo mais restritivo entre filial e profissional
    const effectiveStartTime = this.getLatestTime(
      branchHours.startTime,
      workingDay.startTime,
    );
    const effectiveEndTime = this.getEarliestTime(
      branchHours.endTime,
      workingDay.endTime,
    );

    const workingHours = this.generateTimeSlots(
      effectiveStartTime,
      effectiveEndTime,
      branchHours.lunchStartTime,
      branchHours.lunchEndTime,
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

    // Extrair horários ocupados (formato HH:mm) usando DateTime para timezone correto
    const bookedTimes = existingAppointments.map((apt) => {
      return DateTime.extractTime(apt.scheduledAt);
    });

    // Buscar bloqueios de agenda do profissional nesta data
    const scheduleBlocks = await this.scheduleBlocksService.findByDate(
      professionalId,
      date,
    );

    // Criar lista de horários bloqueados
    const blockedTimes: string[] = [];
    for (const block of scheduleBlocks) {
      const blockStartMinutes = this.timeToMinutes(block.startTime);
      const blockEndMinutes = this.timeToMinutes(block.endTime);

      // Adicionar todos os slots dentro do período bloqueado
      for (const slot of workingHours) {
        const slotMinutes = this.timeToMinutes(slot);
        if (slotMinutes >= blockStartMinutes && slotMinutes < blockEndMinutes) {
          blockedTimes.push(slot);
        }
      }
    }

    // Filtrar horários disponíveis (que não estão agendados nem bloqueados)
    const availableSlots = workingHours.filter(
      (time) => !bookedTimes.includes(time) && !blockedTimes.includes(time),
    );

    return availableSlots;
  }

  private getLatestTime(time1: string, time2: string): string {
    const minutes1 = this.timeToMinutes(time1);
    const minutes2 = this.timeToMinutes(time2);
    return minutes1 > minutes2 ? time1 : time2;
  }

  private getEarliestTime(time1: string, time2: string): string {
    const minutes1 = this.timeToMinutes(time1);
    const minutes2 = this.timeToMinutes(time2);
    return minutes1 < minutes2 ? time1 : time2;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    lunchStartTime?: string | null,
    lunchEndTime?: string | null,
  ): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // Corrigir horários que passam da meia-noite (00:00 = próximo dia)
    if (endMinutes === 0) {
      endMinutes = 24 * 60; // Meia-noite = 1440 minutos
    } else if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Adicionar 24 horas se endTime < startTime
    }

    const lunchStart = lunchStartTime
      ? this.timeToMinutes(lunchStartTime)
      : null;
    const lunchEnd = lunchEndTime ? this.timeToMinutes(lunchEndTime) : null;

    // Gerar slots de 10 em 10 minutos
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 10) {
      const hour = Math.floor(minutes / 60) % 24; // Módulo 24 para horários após meia-noite
      const minute = minutes % 60;

      // Pular horário de almoço se configurado
      if (
        lunchStart !== null &&
        lunchEnd !== null &&
        minutes >= lunchStart &&
        minutes < lunchEnd
      ) {
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
    const appointmentDateStr = DateTime.extractDate(appointment.scheduledAt);
    const todayStr = DateTime.extractDate(now);

    if (appointmentDateStr > todayStr) {
      const dateStr = DateTime.formatDate(appointment.scheduledAt);
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

    // Calcular comissão de SERVIÇOS
    const serviceCommissionRate =
      appointment.professional.customRole?.commissionRate ||
      appointment.professional.commissionRate ||
      0;

    const servicesTotal =
      appointment.appointmentServices?.reduce(
        (sum: number, as: any) => sum + Number(as.service.price),
        0,
      ) || 0;

    const serviceCommissionAmount =
      (servicesTotal * Number(serviceCommissionRate)) / 100;

    // Calcular comissão de PRODUTOS
    const productCommissionRate =
      appointment.professional.customRole?.productCommissionRate ||
      appointment.professional.productCommissionRate ||
      0;

    const productsTotal =
      appointment.appointmentProducts?.reduce(
        (sum: number, ap: any) => sum + Number(ap.total),
        0,
      ) || 0;

    const productCommissionAmount =
      (productsTotal * Number(productCommissionRate)) / 100;

    // Total de comissão
    const totalCommissionAmount =
      serviceCommissionAmount + productCommissionAmount;

    if (totalCommissionAmount <= 0) return;

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
    const description =
      `Comissão: ${appointment.professional.name} - ${appointment.client.name}` +
      (serviceCommissionAmount > 0
        ? ` | Serviços: R$ ${serviceCommissionAmount.toFixed(2)} (${serviceCommissionRate}%)`
        : '') +
      (productCommissionAmount > 0
        ? ` | Produtos: R$ ${productCommissionAmount.toFixed(2)} (${productCommissionRate}%)`
        : '');

    await tx.financialTransaction.create({
      data: {
        description,
        amount: totalCommissionAmount,
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
      const timeStr = DateTime.extractTime(data.scheduledAt);
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
      include: {
        appointmentProducts: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      // Se o appointment estava COMPLETED, precisamos reverter o estoque dos produtos
      if (appointment.status === 'COMPLETED') {
        for (const ap of appointment.appointmentProducts) {
          // Reverter o estoque do produto
          await tx.product.update({
            where: { id: ap.product.id },
            data: {
              currentStock: {
                increment: ap.quantity,
              },
            },
          });

          // Criar movimento de estoque de ajuste (devolução)
          await tx.stockMovement.create({
            data: {
              productId: ap.product.id,
              branchId: appointment.branchId,
              type: 'ADJUSTMENT',
              quantity: ap.quantity,
              reason: `Estorno de venda - Appointment cancelado: ${id}`,
            },
          });
        }

        // Deletar movimentos de estoque de venda relacionados ao appointment
        await tx.stockMovement.deleteMany({
          where: {
            reference: `Atendimento-${id}`,
          },
        });
      }

      // Remover transações financeiras se existirem
      await tx.financialTransaction.deleteMany({
        where: { appointmentId: id },
      });

      // Remover produtos do agendamento
      await tx.appointmentProduct.deleteMany({
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

  // ==================== MÉTODOS DE GERENCIAMENTO DE COMANDA ====================

  /**
   * Inicia um atendimento (muda status de PENDING para IN_PROGRESS)
   */
  async startAppointment(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado');
    }

    if (
      appointment.status !== 'PENDING' &&
      appointment.status !== 'CONFIRMED'
    ) {
      throw new Error(
        `Atendimento não pode ser iniciado. Status atual: ${appointment.status}`,
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
        appointmentProducts: { include: { product: true } },
      },
    });
  }

  /**
   * Adiciona serviços à comanda
   */
  async addServices(id: string, serviceIds: string[]): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado');
    }

    if (appointment.status !== 'IN_PROGRESS') {
      throw new Error(
        'Apenas comandas em andamento podem receber novos serviços',
      );
    }

    // Verificar se os serviços existem
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });

    if (services.length !== serviceIds.length) {
      throw new NotFoundException('Algum dos serviços não foi encontrado');
    }

    // Adicionar serviços (ignorar duplicatas)
    await this.prisma.$transaction(
      serviceIds.map((serviceId) =>
        this.prisma.appointmentService.upsert({
          where: {
            appointmentId_serviceId: {
              appointmentId: id,
              serviceId,
            },
          },
          create: {
            appointmentId: id,
            serviceId,
          },
          update: {}, // Não faz nada se já existir
        }),
      ),
    );

    // Recalcular total
    return this.recalculateTotal(id);
  }

  /**
   * Remove serviços da comanda
   */
  async removeServices(id: string, serviceIds: string[]): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado');
    }

    if (appointment.status !== 'IN_PROGRESS') {
      throw new Error(
        'Apenas comandas em andamento podem ter serviços removidos',
      );
    }

    // Remover serviços
    await this.prisma.appointmentService.deleteMany({
      where: {
        appointmentId: id,
        serviceId: { in: serviceIds },
      },
    });

    // Recalcular total
    return this.recalculateTotal(id);
  }

  /**
   * Adiciona produtos à comanda
   */
  async addProducts(
    id: string,
    products: { productId: string; quantity: number }[],
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado');
    }

    if (appointment.status !== 'IN_PROGRESS') {
      throw new Error('Apenas comandas em andamento podem receber produtos');
    }

    // Verificar se os produtos existem e têm estoque
    const productIds = products.map((p) => p.productId);
    const productsData = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (productsData.length !== productIds.length) {
      throw new NotFoundException('Algum dos produtos não foi encontrado');
    }

    // Adicionar ou atualizar produtos na comanda
    for (const item of products) {
      const product = productsData.find((p) => p.id === item.productId);
      if (!product) continue;

      const unitPrice = Number(product.salePrice) || 0;
      const total = unitPrice * item.quantity;

      await this.prisma.appointmentProduct.upsert({
        where: {
          appointmentId_productId: {
            appointmentId: id,
            productId: item.productId,
          },
        },
        create: {
          appointmentId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          total,
        },
        update: {
          quantity: { increment: item.quantity },
          total: { increment: total },
        },
      });
    }

    // Recalcular total
    return this.recalculateTotal(id);
  }

  /**
   * Remove produtos da comanda
   */
  async removeProducts(id: string, productIds: string[]): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado');
    }

    if (appointment.status !== 'IN_PROGRESS') {
      throw new Error(
        'Apenas comandas em andamento podem ter produtos removidos',
      );
    }

    // Remover produtos
    await this.prisma.appointmentProduct.deleteMany({
      where: {
        appointmentId: id,
        productId: { in: productIds },
      },
    });

    // Recalcular total
    return this.recalculateTotal(id);
  }

  /**
   * Recalcula o total do atendimento baseado nos serviços e produtos
   */
  private async recalculateTotal(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        appointmentServices: { include: { service: true } },
        appointmentProducts: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado');
    }

    // Somar preços dos serviços
    const servicesTotal = appointment.appointmentServices.reduce(
      (sum, as) => sum + Number(as.service.price),
      0,
    );

    // Somar preços dos produtos
    const productsTotal = appointment.appointmentProducts.reduce(
      (sum, ap) => sum + Number(ap.total),
      0,
    );

    const newTotal = servicesTotal + productsTotal;

    return this.prisma.appointment.update({
      where: { id },
      data: { total: newTotal },
      include: {
        professional: true,
        client: true,
        appointmentServices: { include: { service: true } },
        appointmentProducts: { include: { product: true } },
      },
    });
  }

  /**
   * Finaliza a comanda (checkout)
   * - Atualiza status para COMPLETED
   * - Salva método de pagamento
   * - Diminui estoque dos produtos
   * - Cria transações financeiras (receita + comissão)
   */
  async checkoutAppointment(
    id: string,
    paymentMethod: string,
    notes?: string,
  ): Promise<Appointment> {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id },
        include: {
          professional: {
            include: {
              customRole: true,
            },
          },
          client: true,
          appointmentServices: { include: { service: true } },
          appointmentProducts: { include: { product: true } },
        },
      });

      if (!appointment) {
        throw new NotFoundException('Atendimento não encontrado');
      }

      if (appointment.status !== 'IN_PROGRESS') {
        throw new Error('Apenas comandas em andamento podem fazer checkout');
      }

      // 1. Diminuir estoque dos produtos
      for (const ap of appointment.appointmentProducts) {
        const product = await tx.product.findUnique({
          where: { id: ap.productId },
        });

        if (!product) continue;

        // Atualizar estoque
        await tx.product.update({
          where: { id: ap.productId },
          data: {
            currentStock: {
              decrement: Number(ap.quantity),
            },
          },
        });

        // Criar movimento de estoque
        await tx.stockMovement.create({
          data: {
            productId: ap.productId,
            branchId: appointment.branchId,
            type: 'OUT',
            quantity: Number(ap.quantity),
            unitCost: Number(product.costPrice),
            totalCost: Number(product.costPrice) * Number(ap.quantity),
            reason: 'Venda em atendimento',
            reference: `Atendimento-${appointment.id}`,
          },
        });
      }

      // 2. Atualizar appointment com status COMPLETED e paymentMethod
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          paymentMethod: paymentMethod as any,
        },
        include: {
          professional: {
            include: {
              customRole: true,
            },
          },
          client: true,
          appointmentServices: { include: { service: true } },
          appointmentProducts: { include: { product: true } },
        },
      });

      // 3. Criar transações financeiras
      await this.createRevenueTransaction(updatedAppointment, tx);
      await this.createCommissionTransaction(updatedAppointment, tx);

      return updatedAppointment;
    });
  }
}
