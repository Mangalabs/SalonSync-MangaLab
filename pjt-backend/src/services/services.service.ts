import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BaseDataService,
  UserContext,
} from '@/common/services/base-data.service';

@Injectable()
export class ServicesService extends BaseDataService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(user: UserContext) {
    let branchIds: string[];

    if (
      user.branchId &&
      (user.role === 'ADMIN' || user.role === 'SUPERADMIN')
    ) {
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

    if (user.role === 'ADMIN') {
      return this.prisma.service.findMany({
        where: {
          AND: [
            { ownerId: user.id },
            {
              OR: [{ branchId: null }, { branchId: { in: branchIds } }],
            },
          ],
        },
        include: { professionals: true },
      });
    } else if (user.role === 'SUPERADMIN') {
      return this.prisma.service.findMany({
        where: {
          AND: [
            {
              OR: [{ branchId: null }, { branchId: { in: branchIds } }],
            },
          ],
        },
        include: { professionals: true },
      });
    } else {
      const branch = await this.prisma.branch.findFirst({
        where: { id: { in: branchIds } },
        select: { ownerId: true },
      });

      if (!branch) {
        return [];
      }

      return this.prisma.service.findMany({
        where: {
          AND: [
            { ownerId: branch.ownerId },
            {
              OR: [{ branchId: null }, { branchId: { in: branchIds } }],
            },
          ],
        },
        include: { professionals: true },
      });
    }
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { professionals: true },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }

  async create(
    data: { name: string; price: number; duration?: number },
    user: UserContext,
    targetBranchId?: string,
  ) {
    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      const branchId = targetBranchId
        ? await this.getTargetBranchId(user, targetBranchId)
        : null;

      return this.prisma.service.create({
        data: {
          name: data.name,
          price: data.price,
          duration: data.duration || 30,
          branchId,
          ownerId: user.id,
        },
      });
    } else {
      const branchId = await this.getTargetBranchId(user, targetBranchId);

      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        select: { ownerId: true },
      });

      if (!branch) {
        throw new Error('Filial não encontrada');
      }

      return this.prisma.service.create({
        data: {
          name: data.name,
          price: data.price,
          duration: data.duration || 30,
          branchId,
          ownerId: branch.ownerId,
        },
      });
    }
  }

  async update(
    id: string,
    data: { name?: string; price?: number; duration?: number },
    user?: UserContext,
    targetBranchId?: string,
  ) {
    if (user && user.role === 'ADMIN') {
      const branchId = targetBranchId
        ? await this.getTargetBranchId(user, targetBranchId)
        : null;

      return this.prisma.service.update({
        where: { id },
        data: {
          ...data,
          branchId,
        },
      });
    }

    return this.prisma.service.update({ where: { id }, data });
  }

  async remove(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        appointmentServices: {
          include: {
            appointment: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    if (service.appointmentServices && service.appointmentServices.length > 0) {
      const appointmentsCount = service.appointmentServices.length;
      throw new BadRequestException(
        `Não é possível excluir este serviço pois ele possui ${appointmentsCount} agendamento(s) vinculado(s). Para excluí-lo, primeiro remova ou altere os agendamentos.`,
      );
    }

    await this.prisma.service.update({
      where: { id },
      data: {
        professionals: {
          set: [],
        },
      },
    });

    await this.prisma.service.delete({ where: { id } });

    return { message: 'Serviço excluído com sucesso' };
  }
}
