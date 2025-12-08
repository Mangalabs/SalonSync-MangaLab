import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchHoursDto } from './dto/create-branch-hours.dto';

@Injectable()
export class BranchHoursService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(branchId: string, dto: CreateBranchHoursDto) {
    const existing = await this.prisma.branchHours.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId,
          dayOfWeek: dto.dayOfWeek,
        },
      },
    });

    if (existing) {
      return this.prisma.branchHours.update({
        where: { id: existing.id },
        data: {
          startTime: dto.startTime,
          endTime: dto.endTime,
          isOpen: dto.isOpen,
          lunchStartTime: dto.lunchStartTime,
          lunchEndTime: dto.lunchEndTime,
        },
      });
    }

    return this.prisma.branchHours.create({
      data: {
        branchId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isOpen: dto.isOpen,
        lunchStartTime: dto.lunchStartTime,
        lunchEndTime: dto.lunchEndTime,
      },
    });
  }

  async findByBranch(branchId: string) {
    const hours = await this.prisma.branchHours.findMany({
      where: { branchId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Garantir que todos os dias da semana existam
    const allDays: any[] = [];
    for (let day = 0; day <= 6; day++) {
      const existing = hours.find(h => h.dayOfWeek === day);
      if (existing) {
        allDays.push(existing);
      } else {
        // Criar horário padrão para dias não configurados
        allDays.push({
          id: null,
          branchId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          isOpen: day === 0 ? false : true, // Domingo fechado por padrão
          lunchStartTime: null,
          lunchEndTime: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return allDays;
  }

  async updateMultiple(branchId: string, hoursData: CreateBranchHoursDto[]) {
    const results: any[] = [];
    
    for (const dto of hoursData) {
      const result = await this.createOrUpdate(branchId, dto);
      results.push(result);
    }

    return results;
  }

  async delete(branchId: string, dayOfWeek: number) {
    const existing = await this.prisma.branchHours.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId,
          dayOfWeek,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Horário não encontrado');
    }

    return this.prisma.branchHours.delete({
      where: { id: existing.id },
    });
  }

  async isOpen(branchId: string, dayOfWeek: number, time: string): Promise<boolean> {
    const hours = await this.prisma.branchHours.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId,
          dayOfWeek,
        },
      },
    });

    if (!hours || !hours.isOpen) {
      return false;
    }

    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(hours.startTime);
    const endMinutes = this.timeToMinutes(hours.endTime);

    // Verificar se está no horário de funcionamento
    if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
      return false;
    }

    // Verificar se não está no horário de almoço
    if (hours.lunchStartTime && hours.lunchEndTime) {
      const lunchStartMinutes = this.timeToMinutes(hours.lunchStartTime);
      const lunchEndMinutes = this.timeToMinutes(hours.lunchEndTime);
      
      if (timeMinutes >= lunchStartMinutes && timeMinutes <= lunchEndMinutes) {
        return false;
      }
    }

    return true;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}