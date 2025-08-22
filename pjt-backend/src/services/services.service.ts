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

    if (user.role === 'ADMIN') {
      return this.prisma.service.findMany({
        where: {
          AND: [
            { ownerId: user.id },
            {
              OR: [
                { branchId: null }, // Serviços globais
                { branchId: { in: branchIds } }, // Serviços das filiais
              ],
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
              OR: [
                { branchId: null }, // Serviços globais do dono
                { branchId: { in: branchIds } }, // Apenas serviços da filial do funcionário
              ],
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
    data: { name: string; price: number },
    user: UserContext,
    targetBranchId?: string,
  ) {
    console.log('🔧 ServicesService: Creating service with targetBranchId:', targetBranchId);
    
    if (user.role === 'ADMIN') {
      // Admin pode criar serviços globais ou específicos de filial
      const branchId = targetBranchId
        ? await this.getTargetBranchId(user, targetBranchId)
        : null;

      console.log('🔧 ServicesService: Final branchId for creation:', branchId);

      return this.prisma.service.create({
        data: {
          name: data.name,
          price: data.price,
          branchId, // null = global, string = específico da filial
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

  async update(
    id: string, 
    data: { name?: string; price?: number },
    user?: UserContext,
    targetBranchId?: string,
  ) {
    console.log('🔧 ServicesService: Updating service with targetBranchId:', targetBranchId);
    
    // Se user e targetBranchId foram fornecidos, atualizar o branchId também
    if (user && user.role === 'ADMIN') {
      const branchId = targetBranchId
        ? await this.getTargetBranchId(user, targetBranchId)
        : null;
      
      console.log('🔧 ServicesService: Final branchId for update:', branchId);
      
      return this.prisma.service.update({ 
        where: { id }, 
        data: {
          ...data,
          branchId, // null = global, string = específico da filial
        }
      });
    }
    
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
