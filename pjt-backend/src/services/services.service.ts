import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Service } from '@/generated/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
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

  async create(data: { name: string; price: number }) {
    return this.prisma.service.create({ data });
  }

  async update(id: string, data: { name?: string; price?: number }) {
    return this.prisma.service.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.service.delete({ where: { id } });
  }
}
