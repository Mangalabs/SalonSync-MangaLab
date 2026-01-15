import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { DateTime } from '@/utils/dateTime';

@Injectable()
export class ScheduleBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScheduleBlockDto) {
    // Usar a data como string e converter para Date simples (sem timezone)
    // Isso garante que 2026-01-14 será salvo como 2026-01-14 00:00:00
    const blockDate = new Date(dto.date + 'T00:00:00.000Z');

    return this.prisma.scheduleBlock.create({
      data: {
        professionalId: dto.professionalId,
        date: blockDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
      },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findByProfessional(
    professionalId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { professionalId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate + 'T00:00:00.000Z'),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    return this.prisma.scheduleBlock.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        professional: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findByDate(professionalId: string, date: string) {
    // Criar range de data sem conversão de timezone
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    return this.prisma.scheduleBlock.findMany({
      where: {
        professionalId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async delete(id: string) {
    return this.prisma.scheduleBlock.delete({
      where: { id },
    });
  }

  async deleteMany(ids: string[]) {
    return this.prisma.scheduleBlock.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  /**
   * Verifica se um horário específico está bloqueado
   */
  async isTimeBlocked(
    professionalId: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    const blockDate = DateTime.createStartOfDay(date);

    const blocks = await this.prisma.scheduleBlock.findMany({
      where: {
        professionalId,
        date: blockDate,
      },
    });

    // Verificar se o horário está dentro de algum bloqueio
    return blocks.some((block) => {
      return time >= block.startTime && time < block.endTime;
    });
  }
}
