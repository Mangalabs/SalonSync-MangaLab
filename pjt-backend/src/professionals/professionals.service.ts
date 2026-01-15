import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Professional } from '../../prisma/generated/client';
import {
  BaseDataService,
  UserContext,
} from '@/common/services/base-data.service';

@Injectable()
export class ProfessionalsService extends BaseDataService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(user: UserContext): Promise<Professional[]> {
    let branchIds: string[];

    if (user.branchId && user.role === 'ADMIN') {
      const allowedBranchIds = await this.getUserBranchIds({
        ...user,
        branchId: undefined,
      });
      if (allowedBranchIds.includes(user.branchId)) {
        branchIds = [user.branchId];
      } else {
        throw new Error('Acesso negado à filial especificada');
      }
    } else {
      branchIds = await this.getUserBranchIds(user);
    }

    return this.prisma.professional.findMany({
      where: { branchId: { in: branchIds } },
      include: {
        branch: {
          select: { name: true },
        },
        customRole: {
          select: { id: true, title: true, commissionRate: true },
        },
      },
    });
  }

  async findOne(id: string): Promise<Professional> {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });
    if (!professional)
      throw new NotFoundException('Profissional não encontrado');
    return professional;
  }

  async create(
    data: {
      name: string;
      role: string;
      commissionRate?: number;
      roleId?: string;
      baseSalary?: number;
      salaryPayDay?: number;
      workingDays?: number[];
    },
    user: UserContext,
    targetBranchId?: string,
  ): Promise<Professional> {
    const branchId = await this.getTargetBranchId(user, targetBranchId);

    const { roleId, workingDays, ...professionalData } = data;
    const createData: any = {
      ...professionalData,
      branchId,
      commissionRate: data.commissionRate || 0,
    };

    if (roleId && roleId !== 'custom') {
      createData.roleId = roleId;
    }

    return this.prisma.$transaction(async (tx) => {
      const professional = await tx.professional.create({
        data: createData,
        include: {
          customRole: true,
          branch: {
            select: { name: true },
          },
        },
      });

      await this.createSalaryRecurringExpense(professional, branchId, tx);

      if (workingDays && workingDays.length > 0) {
        await Promise.all(
          workingDays.map((dayOfWeek) =>
            tx.professionalWorkingDay.create({
              data: {
                professionalId: professional.id,
                dayOfWeek,
                startTime: '09:00',
                endTime: '18:00',
                isActive: true,
              },
            }),
          ),
        );
      }

      return professional;
    });
  }

  private async createSalaryRecurringExpense(
    professional: any,
    branchId: string,
    tx: any,
  ) {
    const baseSalary =
      professional.customRole?.baseSalary || professional.baseSalary;
    const payDay =
      professional.customRole?.salaryPayDay || professional.salaryPayDay;

    if (!baseSalary || !payDay) {
      return;
    }

    let salaryCategory = await tx.expenseCategory.findFirst({
      where: {
        branchId,
        name: 'Salários',
        type: 'EXPENSE',
      },
    });

    if (!salaryCategory) {
      salaryCategory = await tx.expenseCategory.create({
        data: {
          name: 'Salários',
          type: 'EXPENSE',
          color: '#EC4899',
          branchId,
        },
      });
    }

    const recurringExpense = await tx.recurringExpense.create({
      data: {
        name: `Salário: ${professional.name}`,
        description: `Salário automático do funcionário ${professional.name}`,
        categoryId: salaryCategory.id,
        fixedAmount: Number(baseSalary),
        receiptDay: payDay - 2 > 0 ? payDay - 2 : 1,
        dueDay: payDay,
        isActive: true,
        branchId,
        professionalId: professional.id,
      },
    });
  }

  async update(
    id: string,
    data: Partial<
      Professional & {
        roleId?: string;
        baseSalary?: number;
        salaryPayDay?: number;
        workingDays?: number[];
      }
    >,
  ): Promise<Professional> {
    const {
      roleId,
      baseSalary,
      salaryPayDay,
      workingDays,
      ...professionalData
    } = data;

    const updateData: any = { ...professionalData };

    if (roleId !== undefined) {
      if (roleId === 'custom' || roleId === '') {
        updateData.roleId = null;
      } else {
        updateData.roleId = roleId;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const professional = await tx.professional.update({
        where: { id },
        data: updateData,
        include: {
          customRole: true,
        },
      });

      await this.syncSalaryRecurringExpense(professional, tx);

      if (workingDays !== undefined) {
        await tx.professionalWorkingDay.deleteMany({
          where: { professionalId: id },
        });

        if (workingDays.length > 0) {
          await Promise.all(
            workingDays.map((dayOfWeek) =>
              tx.professionalWorkingDay.create({
                data: {
                  professionalId: id,
                  dayOfWeek,
                  startTime: '09:00',
                  endTime: '18:00',
                  isActive: true,
                },
              }),
            ),
          );
        }
      }

      return professional;
    });
  }

  private async syncSalaryRecurringExpense(professional: any, tx: any) {
    const baseSalary =
      professional.customRole?.baseSalary || professional.baseSalary;
    const payDay =
      professional.customRole?.salaryPayDay || professional.salaryPayDay;

    const existingExpense = await tx.recurringExpense.findFirst({
      where: {
        professionalId: professional.id,
        isActive: true,
      },
    });

    if (baseSalary && payDay) {
      if (existingExpense) {
        await tx.recurringExpense.update({
          where: { id: existingExpense.id },
          data: {
            name: `Salário: ${professional.name}`,
            fixedAmount: Number(baseSalary),
            receiptDay: payDay - 2 > 0 ? payDay - 2 : 1,
            dueDay: payDay,
          },
        });
      } else {
        await this.createSalaryRecurringExpense(
          professional,
          professional.branchId,
          tx,
        );
      }
    } else if (existingExpense) {
      await tx.recurringExpense.update({
        where: { id: existingExpense.id },
        data: { isActive: false },
      });
    }
  }

  async remove(id: string): Promise<void> {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    const allAppointments = await this.prisma.appointment.findMany({
      where: { professionalId: id },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
      },
    });

    const scheduledAppointments = allAppointments.filter((apt) =>
      ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(apt.status),
    );

    if (scheduledAppointments.length > 0) {
      const appointmentsList = scheduledAppointments
        .map(
          (apt) =>
            `- Agendado para ${apt.scheduledAt.toLocaleDateString('pt-BR')}`,
        )
        .join('\n');

      throw new BadRequestException(
        `Não é possível excluir profissional com ${scheduledAppointments.length} agendamento(s) futuro(s):\n\n${appointmentsList}\n\nCancele os agendamentos futuros primeiro.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.recurringExpense.updateMany({
        where: { professionalId: id },
        data: { isActive: false },
      });

      const appointmentsUpdated = await tx.$executeRaw`
        UPDATE "Appointment" 
        SET "professionalId" = NULL 
        WHERE "professionalId" = ${id}
      `;

      const user = await tx.user.findFirst({
        where: {
          name: professional.name,
          role: 'PROFESSIONAL',
        },
      });

      if (user) {
        await tx.user.delete({ where: { id: user.id } });
      }

      await tx.professional.delete({ where: { id } });
    });
  }

  async calculateCommission(
    id: string,
    query: { startDate?: string; endDate?: string },
    user?: UserContext,
  ) {
    const professional = await this.findOne(id);

    if (user && user.role === 'PROFESSIONAL') {
      if (user.branchId && (professional as any).branchId !== user.branchId) {
        throw new Error(
          'Acesso negado: você só pode ver comissões da sua filial',
        );
      }
    }

    let startDate: Date, endDate: Date;

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate + 'T00:00:00');
      endDate = new Date(query.endDate + 'T23:59:59');
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const allAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId: id,
        branchId: (professional as any).branchId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        total: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId: id,
        branchId: (professional as any).branchId,
        status: 'COMPLETED',
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        appointmentServices: {
          include: {
            service: true,
          },
        },
        appointmentProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    // Buscar transações de comissão já criadas no checkout
    const commissionTransactions =
      await this.prisma.financialTransaction.findMany({
        where: {
          branchId: (professional as any).branchId,
          type: 'EXPENSE',
          description: {
            contains: `Comissão: ${professional.name}`,
          },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

    const commissionRate =
      Number((professional as any).commissionRate || 0) / 100;
    const productCommissionRate =
      Number((professional as any).productCommissionRate || 0) / 100;

    const dailyCommissions = appointments.reduce(
      (acc, appointment) => {
        const date = appointment.scheduledAt.toISOString().split('T')[0];

        // Calcular receita de serviços
        const servicesRevenue =
          appointment.appointmentServices?.reduce(
            (sum, as) => sum + Number(as.service.price),
            0,
          ) || 0;

        // Calcular receita de produtos
        const productsRevenue =
          appointment.appointmentProducts?.reduce(
            (sum, ap) => sum + Number(ap.total),
            0,
          ) || 0;

        const totalRevenue = servicesRevenue + productsRevenue;

        // Calcular comissões
        const serviceCommission = servicesRevenue * commissionRate;
        const productCommission = productsRevenue * productCommissionRate;
        const totalCommission = serviceCommission + productCommission;

        if (!acc[date]) {
          acc[date] = {
            date,
            appointments: 0,
            revenue: 0,
            commission: 0,
          };
        }

        acc[date].appointments += 1;
        acc[date].revenue += totalRevenue;
        acc[date].commission += totalCommission;

        return acc;
      },
      {} as Record<
        string,
        {
          date: string;
          appointments: number;
          revenue: number;
          commission: number;
        }
      >,
    );

    const totalAppointments = appointments.length;
    const totalRevenue = appointments.reduce((sum, apt) => {
      const servicesRevenue =
        apt.appointmentServices?.reduce(
          (sum, as) => sum + Number(as.service.price),
          0,
        ) || 0;
      const productsRevenue =
        apt.appointmentProducts?.reduce(
          (sum, ap) => sum + Number(ap.total),
          0,
        ) || 0;
      return sum + servicesRevenue + productsRevenue;
    }, 0);

    // Calcular totais separadamente para serviços e produtos
    const servicesTotal = appointments.reduce(
      (sum, apt) =>
        sum +
        (apt.appointmentServices?.reduce(
          (s, as) => s + Number(as.service.price),
          0,
        ) || 0),
      0,
    );

    const productsTotal = appointments.reduce(
      (sum, apt) =>
        sum +
        (apt.appointmentProducts?.reduce((s, ap) => s + Number(ap.total), 0) ||
          0),
      0,
    );

    // Calcular comissões corretamente
    const appointmentCommissions = servicesTotal * commissionRate;
    const productCommissions = productsTotal * productCommissionRate;
    const totalCommission = appointmentCommissions + productCommissions;

    return {
      professional: {
        id: professional.id,
        name: professional.name,
        commissionRate: Number((professional as any).commissionRate || 0),
        productCommissionRate: Number(
          (professional as any).productCommissionRate || 0,
        ),
      },
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalAppointments,
        totalRevenue,
        totalCommission,
        appointmentCommissions,
        productCommissions,
        productSalesCount: appointments.filter(
          (apt) =>
            apt.appointmentProducts && apt.appointmentProducts.length > 0,
        ).length,
      },
      dailyCommissions: Object.values(dailyCommissions).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }

  async getSalaryCommissionData(id: string, user: UserContext) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      include: {
        customRole: true,
      },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    const branchIds = await this.getUserBranchIds(user);
    if (!branchIds.includes(professional.branchId)) {
      throw new Error('Acesso negado');
    }

    const baseSalary = professional.customRole?.baseSalary || 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId: id,
        status: 'COMPLETED',
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const commissionRate =
      Number(
        professional.customRole?.commissionRate ||
          professional.commissionRate ||
          0,
      ) / 100;
    const totalRevenue = appointments.reduce(
      (sum, apt) => sum + Number(apt.total),
      0,
    );
    const appointmentCommissions = totalRevenue * commissionRate;

    const productCommissions = await this.prisma.financialTransaction.findMany({
      where: {
        branchId: professional.branchId,
        type: 'EXPENSE',
        description: {
          contains: `Comissão venda: ${professional.name}`,
        },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const productCommissionTotal = productCommissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0,
    );

    const currentMonthCommissions =
      appointmentCommissions + productCommissionTotal;
    const totalEstimated = Number(baseSalary) + currentMonthCommissions;

    return {
      professionalId: id,
      professionalName: professional.name,
      baseSalary: Number(baseSalary),
      commissionRate: Number(
        professional.customRole?.commissionRate ||
          professional.commissionRate ||
          0,
      ),
      currentMonthCommissions,
      appointmentCommissions,
      productCommissions: productCommissionTotal,
      totalEstimated,
      appointmentsCount: appointments.length,
      productSalesCount: productCommissions.length,
    };
  }
}
