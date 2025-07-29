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
    const branchIds = await this.getUserBranchIds(user);

    if (user.role === 'ADMIN') {
      return this.prisma.service.findMany({
        where: {
          ownerId: user.id,
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
          ownerId: branch.ownerId,
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
    data: { name: string; price: number },
    user: UserContext,
    targetBranchId?: string,
  ) {
    if (user.role === 'ADMIN') {
      // Admin cria serviços globais
      return this.prisma.service.create({
        data: {
          name: data.name,
          price: data.price,
          branchId: null, // Global para todas as filiais do admin
          ownerId: user.id,
        },
      });
    } else {
      // Funcionário cria serviços específicos da filial
      const branchId = await this.getTargetBranchId(user, targetBranchId);

      // Buscar o dono da filial
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
          branchId,
          ownerId: branch.ownerId, // Serviço pertence ao dono da filial
        },
      });
    }
  }

  async update(id: string, data: { name?: string; price?: number }) {
    return this.prisma.service.update({ where: { id }, data });
  }

  async remove(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    const appointmentServicesCount = await this.prisma.appointmentService.count(
      {
        where: { serviceId: id },
      },
    );

    if (appointmentServicesCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir serviço com agendamentos',
      );
    }

    await this.prisma.service.delete({ where: { id } });
  }
}
