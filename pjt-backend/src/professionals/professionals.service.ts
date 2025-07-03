import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Professional } from '@/generated/client';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Professional[]> {
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

  async create(data: { name: string; role: string }): Promise<Professional> {
    return this.prisma.professional.create({ data });
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
