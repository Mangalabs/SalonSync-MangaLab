import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Client } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string, branchId?: string): Promise<Client[]> {
    console.log('FindAll called with userId:', userId, 'branchId:', branchId); // Debug log

    if (branchId) {
      const clients = await this.prisma.client.findMany({
        where: { branchId },
        orderBy: { name: 'asc' },
      });
      console.log('Found clients by branchId:', clients.length); // Debug log
      return clients;
    }

    if (userId) {
      // Verificar se é admin ou professional
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true },
      });

      console.log('User found:', user); // Debug log

      if (!user) {
        return [];
      }

      if (user.role === 'ADMIN') {
        // Admin: buscar clientes de todas as suas filiais
        const userBranches = await this.prisma.branch.findMany({
          where: { ownerId: userId },
          select: { id: true },
        });
        const branchIds = userBranches.map((b) => b.id);

        const clients = await this.prisma.client.findMany({
          where: { branchId: { in: branchIds } },
          orderBy: { name: 'asc' },
        });
        console.log('Found clients for admin:', clients.length); // Debug log
        return clients;
      } else {
        // Professional: buscar clientes apenas da sua filial
        if (!user.name) {
          return [];
        }

        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          select: { branchId: true },
        });

        if (!professional) {
          return [];
        }

        const clients = await this.prisma.client.findMany({
          where: { branchId: professional.branchId },
          orderBy: { name: 'asc' },
        });
        console.log(
          'Found clients for professional:',
          clients.length,
          'in branch:',
          professional.branchId,
        ); // Debug log
        return clients;
      }
    }

    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async create(
    data: {
      name: string;
      phone?: string;
      email?: string;
    },
    userId?: string,
    targetBranchId?: string,
  ): Promise<Client> {
    let branchId: string;

    if (targetBranchId) {
      // Se targetBranchId foi fornecido, usar ele (vem do contexto da filial ativa)
      const branch = await this.prisma.branch.findUnique({
        where: { id: targetBranchId },
      });
      if (!branch) {
        throw new BadRequestException('Filial não encontrada');
      }
      branchId = targetBranchId;
    } else if (userId) {
      // Verificar se o usuário é admin (tem filiais próprias)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true },
      });

      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }

      if (user.role === 'ADMIN') {
        // Admin: buscar primeira filial do usuário
        const userBranches = await this.prisma.branch.findMany({
          where: { ownerId: userId },
        });

        if (userBranches.length === 0) {
          throw new BadRequestException(
            'Nenhuma filial encontrada para este usuário. Crie uma filial primeiro.',
          );
        }
        branchId = userBranches[0].id;
      } else {
        // Professional: buscar filial através da tabela Professional
        if (!user.name) {
          throw new BadRequestException('Nome do usuário não encontrado');
        }

        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          select: { branchId: true },
        });

        if (!professional) {
          throw new BadRequestException(
            'Profissional não encontrado no sistema.',
          );
        }

        branchId = professional.branchId;
      }
    } else {
      // Fallback para primeira filial do sistema
      const firstBranch = await this.prisma.branch.findFirst();
      if (!firstBranch) {
        throw new BadRequestException('Nenhuma filial encontrada no sistema');
      }
      branchId = firstBranch.id;
    }

    console.log('Creating client with data:', data); // Debug log
    console.log('BranchId:', branchId); // Debug log

    // Filtrar campos undefined
    const clientData: any = {
      name: data.name,
      branchId,
    };

    if (data.phone) clientData.phone = data.phone;
    if (data.email) clientData.email = data.email;

    console.log('Final client data:', clientData); // Debug log

    const createdClient = await this.prisma.client.create({
      data: clientData,
    });

    console.log('Client created successfully:', createdClient); // Debug log
    return createdClient;
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
    },
  ): Promise<Client> {
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
      where: { clientId: id },
    });

    if (appointmentsCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir cliente com agendamentos',
      );
    }

    return this.prisma.client.delete({ where: { id } });
  }
}
