import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';

import Stripe from 'stripe';
import { PrismaService } from '@/prisma/prisma.service';
import { Client } from '@prisma/client';
import {
  BaseDataService,
  UserContext,
} from '@/common/services/base-data.service';

@Injectable()
export class ClientsService extends BaseDataService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(user: UserContext): Promise<Client[]> {
    const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');
    let branchIds: string[];

    if (user.branchId && user.role === 'ADMIN') {
      const allowedBranchIds = await this.getUserBranchIds({
        ...user,
        branchId: undefined,
      });
      if (allowedBranchIds.includes(user.branchId)) {
        branchIds = [user.branchId];
      } else {
        throw new Error('Acesso negado à filial especificada');
      }
    } else {
      branchIds = await this.getUserBranchIds(user);
    }

    const completeUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!completeUser) {
      throw new HttpException(
        'Usuário criador não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    let subscriptions: Stripe.ApiList<Stripe.Subscription>;
    const subMap = new Map<
      string,
      { planName: string; subscriptionId: string }
    >();
    if (completeUser.accountId) {
      subscriptions = await stripeClient.subscriptions.list(
        {
          status: 'active',
          expand: ['data.items.data.price'], // só até price
          limit: 100,
        },
        { stripeAccount: completeUser.accountId },
      );

      const productIds = new Set<string>();
      subscriptions.data.forEach((sub) => {
        sub.items.data.forEach((item) => {
          productIds.add(item.price.product as string);
        });
      });

      const products = await stripeClient.products.list(
        { limit: 100, active: true },
        { stripeAccount: completeUser.accountId },
      );

      const productMap = new Map(products.data.map((p) => [p.id, p]));

      subscriptions.data.forEach((sub) => {
        const customerId = sub.customer as string;
        const productId = sub.items.data[0].price.product as string;
        const product = productMap.get(productId);

        if (product) {
          subMap.set(customerId, {
            planName: product.name,
            subscriptionId: sub.id,
          });
        }
      });
    }

    const clients = await this.prisma.client.findMany({
      where: {
        branchId: { in: branchIds },
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return clients.map((client) => {
      if (!client.customerId) {
        return { ...client, subscription: null };
      }

      return {
        ...client,
        subscription: subMap.get(client.customerId) ?? null,
      };
    });
  }

  async create(
    data: {
      name: string;
      phone?: string;
      email?: string;
    },
    user: UserContext,
    targetBranchId?: string,
  ): Promise<Client> {
    if (!data.name) {
      throw new Error('Name is required but not provided');
    }

    const branchId = targetBranchId || (await this.getTargetBranchId(user));

    const clientData = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      branchId,
    };

    return this.prisma.client.create({
      data: clientData,
    });
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
    const client = await this.prisma.client.findUnique({
      where: { id, isActive: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se há agendamentos ativos (não concluídos)
    const activeAppointmentsCount = await this.prisma.appointment.count({
      where: {
        clientId: id,
        status: 'PENDING',
      },
    });

    if (activeAppointmentsCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir cliente com agendamentos ativos. Cancele ou conclua os agendamentos primeiro.',
      );
    }

    // Soft delete - marcar como inativo ao invés de excluir
    return this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
