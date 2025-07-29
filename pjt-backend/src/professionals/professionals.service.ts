import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Professional } from '@/generated/client';
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
    const branchIds = await this.getUserBranchIds(user);

    return this.prisma.professional.findMany({
      where: { branchId: { in: branchIds } },
      include: {
        branch: {
          select: { name: true },
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
    data: { name: string; role: string },
    user: UserContext,
    targetBranchId?: string,
  ): Promise<Professional> {
    const branchId = await this.getTargetBranchId(user, targetBranchId);

    return this.prisma.professional.create({
      data: { ...data, branchId },
    });
  }

  async update(id: string, data: Partial<Professional>): Promise<Professional> {
    return this.prisma.professional.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    const appointmentsCount = await this.prisma.appointment.count({
      where: { professionalId: id },
    });

    if (appointmentsCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir profissional com agendamentos',
      );
    }

    await this.prisma.professional.delete({ where: { id } });
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
}
