import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BaseDataService,
  UserContext,
} from '@/common/services/base-data.service';

@Injectable()
export class ProfessionalAbsenceService extends BaseDataService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    data: {
      professionalId: string;
      startDate: Date;
      endDate: Date;
      reason?: string;
      type: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'TRAINING' | 'OTHER';
      isRecurring?: boolean;
    },
    user: UserContext,
  ) {
    // Verificar se o profissional existe e pertence à filial do usuário
    const professional = await this.prisma.professional.findFirst({
      where: {
        id: data.professionalId,
        branchId: { in: await this.getUserBranchIds(user) },
      },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    // Verificar conflitos com ausências existentes
    const conflictingAbsence = await this.prisma.professionalAbsence.findFirst({
      where: {
        professionalId: data.professionalId,
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          },
        ],
      },
    });

    if (conflictingAbsence) {
      throw new Error('Já existe uma ausência registrada neste período');
    }

    return this.prisma.professionalAbsence.create({
      data,
      include: {
        professional: {
          select: { name: true },
        },
      },
    });
  }

  async findAll(user: UserContext, professionalId?: string) {
    try {
      const branchIds = await this.getUserBranchIds(user);

      if (!branchIds || branchIds.length === 0) {
        return [];
      }

      const where: any = {
        professional: {
          branchId: { in: branchIds },
        },
      };

      if (professionalId) {
        where.professionalId = professionalId;
      }

      const absences = await this.prisma.professionalAbsence.findMany({
        where,
        include: {
          professional: {
            select: { name: true },
          },
        },
        orderBy: { startDate: 'desc' },
      });

      return absences;
    } catch (error) {
      return [];
    }
  }

  async update(
    id: string,
    data: {
      startDate?: Date;
      endDate?: Date;
      reason?: string;
      type?: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'TRAINING' | 'OTHER';
      isRecurring?: boolean;
    },
    user: UserContext,
  ) {
    const absence = await this.prisma.professionalAbsence.findFirst({
      where: {
        id,
        professional: {
          branchId: { in: await this.getUserBranchIds(user) },
        },
      },
    });

    if (!absence) {
      throw new NotFoundException('Ausência não encontrada');
    }

    return this.prisma.professionalAbsence.update({
      where: { id },
      data,
      include: {
        professional: {
          select: { name: true },
        },
      },
    });
  }

  async delete(id: string, user: UserContext) {
    const absence = await this.prisma.professionalAbsence.findFirst({
      where: {
        id,
        professional: {
          branchId: { in: await this.getUserBranchIds(user) },
        },
      },
    });

    if (!absence) {
      throw new NotFoundException('Ausência não encontrada');
    }

    await this.prisma.professionalAbsence.delete({
      where: { id },
    });
  }

  async getUpcomingAbsences(user: UserContext) {
    const branchIds = await this.getUserBranchIds(user);
    const today = new Date();

    return this.prisma.professionalAbsence.findMany({
      where: {
        professional: {
          branchId: { in: branchIds },
        },
        endDate: { gte: today },
      },
      include: {
        professional: {
          select: { name: true },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 10,
    });
  }
}
