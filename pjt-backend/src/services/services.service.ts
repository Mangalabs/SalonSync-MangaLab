import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string, branchId?: string) {
    if (branchId) {
      return this.prisma.service.findMany({
        where: { branchId },
        include: { professionals: true },
      });
    }
    
    if (userId) {
      const userBranches = await this.prisma.branch.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      const branchIds = userBranches.map(b => b.id);
      
      return this.prisma.service.findMany({
        where: { branchId: { in: branchIds } },
        include: { professionals: true },
      });
    }
    
    return this.prisma.service.findMany({
      include: { professionals: true },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { professionals: true },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }

  async create(data: { name: string; price: number }, userId?: string, targetBranchId?: string) {
    let branchId: string;
    
    if (targetBranchId && userId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: targetBranchId, ownerId: userId }
      });
      if (!branch) throw new Error('Filial não encontrada ou não pertence ao usuário');
      branchId = targetBranchId;
    } else if (userId) {
      const userBranch = await this.prisma.branch.findFirst({
        where: { ownerId: userId }
      });
      if (!userBranch) throw new Error('Nenhuma filial encontrada para este usuário');
      branchId = userBranch.id;
    } else {
      const firstBranch = await this.prisma.branch.findFirst();
      if (!firstBranch) throw new Error('Nenhuma filial encontrada');
      branchId = firstBranch.id;
    }
    
    return this.prisma.service.create({ 
      data: { ...data, branchId } 
    });
  }

  async update(id: string, data: { name?: string; price?: number }) {
    return this.prisma.service.update({ where: { id }, data });
  }

  async remove(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }
    
    const appointmentServicesCount = await this.prisma.appointmentService.count({
      where: { serviceId: id }
    });
    
    if (appointmentServicesCount > 0) {
      throw new BadRequestException('Não é possível excluir serviço com agendamentos');
    }
    
    await this.prisma.service.delete({ where: { id } });
  }
}
