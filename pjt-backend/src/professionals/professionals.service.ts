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

    // Se branchId específico foi fornecido, usar apenas ele
    if (user.branchId && user.role === 'ADMIN') {
      // Verificar se admin tem acesso a esta filial
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
    },
    user: UserContext,
    targetBranchId?: string,
  ): Promise<Professional> {
    console.log('🔍 Creating professional with data:', data);

    const branchId = await this.getTargetBranchId(user, targetBranchId);

    const { roleId, ...professionalData } = data;
    const createData: any = {
      ...professionalData,
      branchId,
      commissionRate: data.commissionRate || 0,
    };

    // Tratar roleId
    if (roleId && roleId !== 'custom') {
      createData.roleId = roleId;
      console.log('✅ Professional will have custom role:', roleId);
    } else {
      console.log('❌ Professional will NOT have custom role');
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

      console.log('👤 Professional created:', {
        id: professional.id,
        name: professional.name,
        hasCustomRole: !!professional.customRole,
        customRoleData: professional.customRole,
      });

      // Criar despesa fixa automática se tiver salário configurado
      await this.createSalaryRecurringExpense(professional, branchId, tx);

      console.log(
        `✅ Professional creation completed for: ${professional.name}`,
      );
      return professional;
    });
  }

  private async createSalaryRecurringExpense(
    professional: any,
    branchId: string,
    tx: any,
  ) {
    console.log('🔍 Creating salary recurring expense for:', {
      professionalId: professional.id,
      professionalName: professional.name,
      branchId,
      customRole: professional.customRole,
      baseSalary: professional.baseSalary,
    });

    const baseSalary =
      professional.customRole?.baseSalary || professional.baseSalary;
    const payDay =
      professional.customRole?.salaryPayDay || professional.salaryPayDay;

    console.log('💰 Salary data:', { baseSalary, payDay });

    if (!baseSalary || !payDay) {
      console.log(
        '❌ Missing salary data, skipping automatic expense creation',
      );
      return;
    }

    // Buscar ou criar categoria de salários
    let salaryCategory = await tx.expenseCategory.findFirst({
      where: {
        branchId,
        name: 'Salários',
        type: 'EXPENSE',
      },
    });

    if (!salaryCategory) {
      console.log('📝 Creating Salários category');
      salaryCategory = await tx.expenseCategory.create({
        data: {
          name: 'Salários',
          type: 'EXPENSE',
          color: '#EC4899',
          branchId,
        },
      });
    }

    console.log('📋 Category found/created:', salaryCategory.id);

    // Criar despesa fixa automática
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

    console.log('✅ Recurring expense created:', recurringExpense.id);
  }

  async update(
    id: string,
    data: Partial<
      Professional & {
        roleId?: string;
        baseSalary?: number;
        salaryPayDay?: number;
      }
    >,
  ): Promise<Professional> {
    const { roleId, baseSalary, salaryPayDay, ...professionalData } = data;

    const updateData: any = { ...professionalData };

    // Tratar roleId
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

      // Sincronizar despesa fixa se salário foi alterado
      await this.syncSalaryRecurringExpense(professional, tx);

      console.log(`✅ Professional update completed for: ${professional.name}`);
      return professional;
    });
  }

  private async syncSalaryRecurringExpense(professional: any, tx: any) {
    const baseSalary =
      professional.customRole?.baseSalary || professional.baseSalary;
    const payDay =
      professional.customRole?.salaryPayDay || professional.salaryPayDay;

    console.log(`🔄 Syncing salary for ${professional.name}:`, {
      baseSalary,
      payDay,
      hasCustomRole: !!professional.customRole,
    });

    // Buscar despesa fixa existente
    const existingExpense = await tx.recurringExpense.findFirst({
      where: {
        professionalId: professional.id,
        isActive: true,
      },
    });

    console.log(`🔍 Existing expense found:`, !!existingExpense);

    if (baseSalary && payDay) {
      if (existingExpense) {
        // Atualizar despesa existente
        await tx.recurringExpense.update({
          where: { id: existingExpense.id },
          data: {
            name: `Salário: ${professional.name}`,
            fixedAmount: Number(baseSalary),
            receiptDay: payDay - 2 > 0 ? payDay - 2 : 1,
            dueDay: payDay,
          },
        });
        console.log(`✅ Updated existing recurring expense`);
      } else {
        // Criar nova despesa
        await this.createSalaryRecurringExpense(
          professional,
          professional.branchId,
          tx,
        );
        console.log(`✅ Created new recurring expense`);
      }
    } else if (existingExpense) {
      // Desativar despesa se salário foi removido
      await tx.recurringExpense.update({
        where: { id: existingExpense.id },
        data: { isActive: false },
      });
      console.log(`❌ Deactivated recurring expense (no salary data)`);
    } else {
      console.log(`ℹ️ No salary data and no existing expense - nothing to do`);
    }
  }

  async remove(id: string): Promise<void> {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    // Verificar agendamentos do profissional
    const allAppointments = await this.prisma.appointment.findMany({
      where: { professionalId: id },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
      },
    });

    console.log(`🔍 Professional ${professional.name} (${id}) appointments:`, {
      total: allAppointments.length,
      appointments: allAppointments.map((apt) => ({
        id: apt.id.substring(0, 8),
        status: apt.status,
        date: apt.scheduledAt.toISOString().split('T')[0],
      })),
    });

    // Verificar apenas agendamentos que estão agendados (futuros)
    const scheduledAppointments = allAppointments.filter(
      (apt) => apt.status === 'SCHEDULED',
    );

    console.log(
      `📊 Scheduled (future) appointments: ${scheduledAppointments.length}`,
    );
    console.log(
      `ℹ️  Completed/Cancelled appointments are OK to delete: ${allAppointments.length - scheduledAppointments.length}`,
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
      // Desativar despesas fixas relacionadas
      await tx.recurringExpense.updateMany({
        where: { professionalId: id },
        data: { isActive: false },
      });

      // Remover referência do profissional nos agendamentos (manter histórico)
      const appointmentsUpdated = await tx.$executeRaw`
        UPDATE "Appointment" 
        SET "professionalId" = NULL 
        WHERE "professionalId" = ${id}
      `;

      console.log(
        `📅 Updated ${appointmentsUpdated} appointments to remove professional reference`,
      );

      // Buscar e excluir usuário correspondente (se existir)
      const user = await tx.user.findFirst({
        where: {
          name: professional.name,
          role: 'PROFESSIONAL',
        },
      });

      console.log(
        `🔍 Looking for user account for ${professional.name}:`,
        user ? 'Found' : 'Not found',
      );

      if (user) {
        await tx.user.delete({ where: { id: user.id } });
        console.log(`🗑️ User account deleted: ${user.email}`);
      }

      // Excluir profissional
      await tx.professional.delete({ where: { id } });

      console.log(
        `✅ Professional ${professional.name} (${id}) deleted successfully`,
      );
      console.log(`🗑️ User account also deleted: ${user ? 'Yes' : 'No'}`);
      console.log(`💰 Recurring expenses deactivated`);
    });
  }

  async calculateCommission(
    id: string,
    query: { startDate?: string; endDate?: string },
    user?: UserContext,
  ) {
    const professional = await this.findOne(id);

    // Se for funcionário, verificar se está vendo comissão da sua filial
    if (user && user.role === 'PROFESSIONAL') {
      // Verificar se o profissional pertence à mesma filial do usuário
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

    // First, let's see ALL appointments for this professional
    const allAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId: id,
        branchId: (professional as any).branchId,
      },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        total: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    console.log(
      '📊 ALL appointments for professional:',
      allAppointments.length,
      allAppointments.map((apt) => ({
        id: apt.id.substring(0, 8),
        status: apt.status,
        scheduledAt: apt.scheduledAt.toISOString(),
        total: apt.total,
      })),
    );

    console.log('🔍 Searching COMPLETED appointments with criteria:', {
      professionalId: id,
      branchId: (professional as any).branchId,
      status: 'COMPLETED',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
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
      },
    });

    console.log(
      '📊 Found appointments:',
      appointments.length,
      appointments.map((apt) => ({
        id: apt.id,
        status: apt.status,
        scheduledAt: apt.scheduledAt.toISOString(),
        total: apt.total,
      })),
    );

    const commissionRate =
      Number((professional as any).commissionRate || 0) / 100;

    const dailyCommissions = appointments.reduce(
      (acc, appointment) => {
        const date = appointment.scheduledAt.toISOString().split('T')[0];
        const total = Number(appointment.total);
        const commission = total * commissionRate;

        if (!acc[date]) {
          acc[date] = {
            date,
            appointments: 0,
            revenue: 0,
            commission: 0,
          };
        }

        acc[date].appointments += 1;
        acc[date].revenue += total;
        acc[date].commission += commission;

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
    const totalRevenue = appointments.reduce(
      (sum, apt) => sum + Number(apt.total),
      0,
    );
    const totalCommission = totalRevenue * commissionRate;

    return {
      professional: {
        id: professional.id,
        name: professional.name,
        commissionRate: Number((professional as any).commissionRate || 0),
      },
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalAppointments,
        totalRevenue,
        totalCommission,
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

    // Verificar acesso
    const branchIds = await this.getUserBranchIds(user);
    if (!branchIds.includes(professional.branchId)) {
      throw new Error('Acesso negado');
    }

    // Buscar salário base (apenas no customRole)
    const baseSalary = professional.customRole?.baseSalary || 0;

    // Calcular comissões do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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

    // Calcular comissões diretamente dos atendimentos confirmados
    const commissionRate = Number(professional.customRole?.commissionRate || professional.commissionRate || 0) / 100;
    const totalRevenue = appointments.reduce((sum, apt) => sum + Number(apt.total), 0);
    const currentMonthCommissions = totalRevenue * commissionRate;

    console.log('🔍 Debug getSalaryCommissionData:', {
      professionalId: id,
      professionalName: professional.name,
      baseSalary: Number(baseSalary),
      commissionRate: commissionRate * 100,
      appointmentsCount: appointments.length,
      totalRevenue,
      currentMonthCommissions,
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
    });
    const totalEstimated = Number(baseSalary) + currentMonthCommissions;

    return {
      professionalId: id,
      professionalName: professional.name,
      baseSalary: Number(baseSalary),
      commissionRate: Number(professional.customRole?.commissionRate || professional.commissionRate || 0),
      currentMonthCommissions,
      totalEstimated,
      appointmentsCount: appointments.length,
    };
  }
}
