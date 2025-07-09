import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Client } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string, branchId?: string): Promise<Client[]> {
    if (branchId) {
      return this.prisma.client.findMany({
        where: { branchId },
        orderBy: { name: 'asc' }
      });
    }
    
    if (userId) {
      const userBranches = await this.prisma.branch.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      const branchIds = userBranches.map(b => b.id);
      
      return this.prisma.client.findMany({
        where: { branchId: { in: branchIds } },
        orderBy: { name: 'asc' }
      });
    }
    
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async create(data: {
    name: string;
    phone?: string;
    email?: string;
  }, userId?: string, targetBranchId?: string): Promise<Client> {
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
    
    return this.prisma.client.create({ 
      data: { ...data, branchId } 
    });
  }

  async update(id: string, data: {
    name?: string;
    phone?: string;
    email?: string;
  }): Promise<Client> {
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
      where: { clientId: id }
    });
    
    if (appointmentsCount > 0) {
      throw new BadRequestException('Não é possível excluir cliente com agendamentos');
    }
    
    return this.prisma.client.delete({ where: { id } });
  }
}
