import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Client } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Client[]> {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  create(data: {
    name: string;
    phone?: string;
    email?: string;
  }): Promise<Client> {
    return this.prisma.client.create({ data });
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
