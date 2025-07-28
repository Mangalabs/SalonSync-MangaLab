import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Client } from '@prisma/client';
import { BaseDataService, UserContext } from '@/common/services/base-data.service';

@Injectable()
export class ClientsService extends BaseDataService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(user: UserContext): Promise<Client[]> {
    const branchIds = await this.getUserBranchIds(user);
    
    return this.prisma.client.findMany({
      where: { branchId: { in: branchIds } },
      orderBy: { name: 'asc' }
    });
  }

  async create(data: {
    name: string;
    phone?: string;
    email?: string;
  }, user: UserContext, targetBranchId?: string): Promise<Client> {
    console.log('=== ClientsService CREATE DEBUG ===');
    console.log('Received data:', JSON.stringify(data, null, 2));
    console.log('Data type:', typeof data);
    console.log('Data.name:', data.name);
    console.log('Data.name type:', typeof data.name);
    console.log('User context:', JSON.stringify(user, null, 2));
    
    if (!data.name) {
      throw new Error('Name is required but not provided');
    }
    
    const branchId = await this.getTargetBranchId(user, targetBranchId);
    console.log('Target branchId:', branchId);
    
    const clientData = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      branchId
    };
    
    console.log('Final client data:', JSON.stringify(clientData, null, 2));
    console.log('=== END DEBUG ===');
    
    return this.prisma.client.create({ 
      data: clientData
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