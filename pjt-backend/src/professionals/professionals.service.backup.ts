import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Professional } from '@/generated/client';
import { CommissionQueryDto } from './dto/commission-query.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string, branchId?: string): Promise<Professional[]> {
    if (branchId) {
      return this.prisma.professional.findMany({
        where: { branchId },
        include: {
          branch: {
            select: { name: true }
          }
        }
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
        // Admin: buscar profissionais de todas suas filiais
        const userBranches = await this.prisma.branch.findMany({
          where: { ownerId: userId },
          select: { id: true }
        });
        const branchIds = userBranches.map(b => b.id);
        
        return this.prisma.professional.findMany({
          where: { branchId: { in: branchIds } },
          include: {
            branch: {
              select: { name: true }
            }
          }
        });
      } else {
        // Professional: buscar profissionais da sua filial
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
        
        return this.prisma.professional.findMany({
          where: { branchId: professional.branchId },
          include: {
            branch: {
              select: { name: true }
            }
          }
        });
      }
    }
    
    return [];
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

  async calculateCommission(id: string, query: CommissionQueryDto) {
    const professional = await this.findOne(id);
    
    // Definir período de cálculo
    let startDate: Date, endDate: Date;
    
    if (query.startDate && query.endDate) {
      // Garantir que as datas estão no formato correto
      startDate = new Date(query.startDate + 'T00:00:00');
      endDate = new Date(query.endDate + 'T23:59:59');
    } else {
      // Padrão: mês atual
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Último dia do mês
    }
    
    console.log('Calculando comissões para:', {
      professional: professional.name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    // Buscar atendimentos concluídos no período
    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId: id,
        status: 'COMPLETED',
        scheduledAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        appointmentServices: {
          include: {
            service: true
          }
        }
      }
    });
    
    console.log(`Encontrados ${appointments.length} atendimentos no período:`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      appointments: appointments.map(apt => ({
        id: apt.id,
        scheduledAt: apt.scheduledAt,
        status: apt.status,
        total: apt.total
      }))
    });
    
    // Calcular comissão
    const commissionRate = Number(professional['commissionRate'] || 0) / 100;
    
    // Agrupar por dia
    const dailyCommissions = appointments.reduce((acc, appointment) => {
      const date = appointment.scheduledAt.toISOString().split('T')[0];
      const total = Number(appointment.total);
      const commission = total * commissionRate;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          appointments: 0,
          revenue: 0,
          commission: 0
        };
      }
      
      acc[date].appointments += 1;
      acc[date].revenue += total;
      acc[date].commission += commission;
      
      return acc;
    }, {} as Record<string, { date: string; appointments: number; revenue: number; commission: number }>);
    
    // Calcular totais
    const totalAppointments = appointments.length;
    const totalRevenue = appointments.reduce((sum, apt) => sum + Number(apt.total), 0);
    const totalCommission = totalRevenue * commissionRate;
    
    return {
      professional: {
        id: professional.id,
        name: professional.name,
        commissionRate: Number(professional['commissionRate'] || 0)
      },
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      summary: {
        totalAppointments,
        totalRevenue,
        totalCommission
      },
      dailyCommissions: Object.values(dailyCommissions).sort((a, b) => a.date.localeCompare(b.date))
    };
  }
}
