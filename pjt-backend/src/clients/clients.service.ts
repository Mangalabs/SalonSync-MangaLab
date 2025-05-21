import { Injectable } from '@nestjs/common';
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

  delete(id: string): Promise<Client> {
    return this.prisma.client.delete({ where: { id } });
  }
}
