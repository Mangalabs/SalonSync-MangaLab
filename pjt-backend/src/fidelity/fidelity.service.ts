import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FidelityService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateStripeCustomer(
    clientId: string,
    email: string,
    accountId: string,
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    if (client.customerId) {
      return client.customerId as string;
    }

    const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

    const customer = await stripeClient.customers.create(
      { email, metadata: { clientId } },
      { stripeAccount: accountId },
    );

    await this.prisma.client.update({
      where: { id: clientId },
      data: { customerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSessionForSubscription(
    clientId: string,
    email: string,
    accountId: string,
    priceId: string,
  ) {
    const customerId = await this.getOrCreateStripeCustomer(
      clientId,
      email,
      accountId,
    );

    const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

    const session = await stripeClient.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url:
          'https://salonsync.mangalab.io/?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://salonsync.mangalab.io/',
      },
      { stripeAccount: accountId },
    );

    return session.url;
  }

  async createManagementSessionForSubscription(
    clientId: string,
    email: string,
    accountId: string,
  ) {
    const customerId = await this.getOrCreateStripeCustomer(
      clientId,
      email,
      accountId,
    );

    const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

    const config = await stripeClient.billingPortal.configurations.create(
      {
        business_profile: {
          headline: 'Portal do Cliente',
        },
        features: {
          subscription_cancel: { enabled: true },
          payment_method_update: { enabled: true },
          invoice_history: { enabled: true },
        },
      },
      {
        stripeAccount: accountId,
      },
    );

    const session = await stripeClient.billingPortal.sessions.create(
      {
        customer: customerId,
        return_url: 'https://salonsync.mangalab.io/',
        configuration: config.id,
      },
      {
        stripeAccount: accountId,
      },
    );

    return session.url;
  }
}
