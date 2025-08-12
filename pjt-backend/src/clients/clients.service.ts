import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Client } from '@prisma/client';
import {
  BaseDataService,
  UserContext,
} from '@/common/services/base-data.service';

@Injectable()
export class ClientsService extends BaseDataService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(user: UserContext): Promise<Client[]> {
    let branchIds: string[];
    
    // Se branchId específico foi fornecido, usar apenas ele
    if (user.branchId && user.role === 'ADMIN') {
      // Verificar se admin tem acesso a esta filial
      const allowedBranchIds = await this.getUserBranchIds({ ...user, branchId: undefined });
      if (allowedBranchIds.includes(user.branchId)) {
        branchIds = [user.branchId];
      } else {
        throw new Error('Acesso negado à filial especificada');
      }
    } else {
      branchIds = await this.getUserBranchIds(user);
    }

    return this.prisma.client.findMany({
      where: { branchId: { in: branchIds } },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    data: {
      name: string;
      phone?: string;
      email?: string;
    },
    user: UserContext,
    targetBranchId?: string,
  ): Promise<Client> {
    if (!data.name) {
      throw new Error('Name is required but not provided');
    }

    // Use targetBranchId if provided, otherwise use getTargetBranchId logic
    const branchId = targetBranchId || await this.getTargetBranchId(user);

    const clientData = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      branchId,
    };

    return this.prisma.client.create({
      data: clientData,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
    },
  ): Promise<Client> {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return this.prisma.client.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Client> {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const appointmentsCount = await this.prisma.appointment.count({
      where: { clientId: id },
    });

    if (appointmentsCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir cliente com agendamentos',
      );
    }

    return this.prisma.client.delete({ where: { id } });
  }
}
