import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Professional } from '@/generated/client';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string, branchId?: string): Promise<Professional[]> {
    // Se temos branchId específico, filtrar apenas por ele
    if (branchId) {
      return this.prisma.professional.findMany({
        where: { branchId }
      });
    }
    
    // Se temos userId, buscar todas as filiais do usuário
    if (userId) {
      const userBranches = await this.prisma.branch.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      const branchIds = userBranches.map(b => b.id);
      
      return this.prisma.professional.findMany({
        where: { branchId: { in: branchIds } }
      });
    }
    
    // Fallback: retornar todos
    return this.prisma.professional.findMany();
  }

  async findOne(id: string): Promise<Professional> {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
    });
    if (!professional)
      throw new NotFoundException('Profissional não encontrado');
    return professional;
  }

  async create(data: { name: string; role: string }, userId?: string, targetBranchId?: string): Promise<Professional> {
    console.log('🔍 Professional Service Create:', { data, userId, targetBranchId });
    
    let branchId: string;
    
    if (targetBranchId && userId) {
      console.log('🔍 Looking for specific branch:', targetBranchId, 'for user:', userId);
      const branch = await this.prisma.branch.findFirst({
        where: { id: targetBranchId, ownerId: userId }
      });
      console.log('🔍 Branch found:', branch);
      if (!branch) throw new Error('Filial não encontrada ou não pertence ao usuário');
      branchId = targetBranchId;
    } else if (userId) {
      console.log('🔍 Looking for user branch for userId:', userId);
      const userBranch = await this.prisma.branch.findFirst({
        where: { ownerId: userId }
      });
      console.log('🔍 User branch found:', userBranch);
      if (!userBranch) throw new Error('Nenhuma filial encontrada para este usuário');
      branchId = userBranch.id;
    } else {
      console.log('🔍 Looking for any branch (fallback)');
      const firstBranch = await this.prisma.branch.findFirst();
      console.log('🔍 First branch found:', firstBranch);
      if (!firstBranch) throw new Error('Nenhuma filial encontrada');
      branchId = firstBranch.id;
    }
    
    console.log('🚀 Creating professional with branchId:', branchId);
    const result = await this.prisma.professional.create({ 
      data: { ...data, branchId } 
    });
    console.log('✅ Professional created:', result);
    
    return result;
  }

  async update(id: string, data: Partial<Professional>): Promise<Professional> {
    return this.prisma.professional.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    const professional = await this.prisma.professional.findUnique({ where: { id } });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }
    
    const appointmentsCount = await this.prisma.appointment.count({
      where: { professionalId: id }
    });
    
    if (appointmentsCount > 0) {
      throw new BadRequestException('Não é possível excluir profissional com agendamentos');
    }
    
    await this.prisma.professional.delete({ where: { id } });
  }

  async addServiceToProfessional(professionalId: string, serviceId: string) {
    return this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        services: {
          connect: { id: serviceId },
        },
      },
    });
  }

  async getServicesByProfessional(professionalId: string) {
    return this.prisma.professional.findUnique({
      where: { id: professionalId },
      include: { services: true },
    });
  }

  async removeServiceFromProfessional(
    professionalId: string,
    serviceId: string,
  ) {
    return this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        services: {
          disconnect: { id: serviceId },
        },
      },
    });
  }
}
