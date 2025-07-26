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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true }
      });
      
      if (!user) {
        return [];
      }
      
      if (user.role === 'ADMIN') {
        const userBranches = await this.prisma.branch.findMany({
          where: { ownerId: userId },
          select: { id: true }
        });
        const branchIds = userBranches.map(b => b.id);
        
        return this.prisma.service.findMany({
          where: { branchId: { in: branchIds } },
          include: { professionals: true },
        });
      } else {
        if (!user.name) {
          return [];
        }
        
        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          select: { branchId: true }
        });
        
        if (!professional) {
          return [];
        }
        
        return this.prisma.service.findMany({
          where: { branchId: professional.branchId },
          include: { professionals: true },
        });
      }
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
    console.log('Service create - Received data:', data); // Debug log
    console.log('Service create - UserId:', userId); // Debug log
    console.log('Service create - TargetBranchId:', targetBranchId); // Debug log
    
    let branchId: string;
    
    if (targetBranchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: targetBranchId }
      });
      if (!branch) {
        throw new BadRequestException('Filial não encontrada');
      }
      branchId = targetBranchId;
    } else if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true }
      });
      
      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }
      
      if (user.role === 'ADMIN') {
        const userBranches = await this.prisma.branch.findMany({
          where: { ownerId: userId }
        });
        
        if (userBranches.length === 0) {
          throw new BadRequestException('Nenhuma filial encontrada para este usuário.');
        }
        branchId = userBranches[0].id;
      } else {
        if (!user.name) {
          throw new BadRequestException('Nome do usuário não encontrado');
        }
        
        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          select: { branchId: true }
        });
        
        if (!professional) {
          throw new BadRequestException('Profissional não encontrado no sistema.');
        }
        
        branchId = professional.branchId;
      }
    } else {
      const firstBranch = await this.prisma.branch.findFirst();
      if (!firstBranch) {
        throw new BadRequestException('Nenhuma filial encontrada no sistema');
      }
      branchId = firstBranch.id;
    }
    
    return this.prisma.service.create({ 
      data: { 
        name: data.name,
        price: data.price,
        branchId 
      } 
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
