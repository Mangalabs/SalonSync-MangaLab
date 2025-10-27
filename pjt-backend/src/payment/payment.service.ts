import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomerDto,
  CreateCheckoutSessionDto,
  CreateAccountSessionDto,
} from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createCustomer(data: CreateCustomerDto) {
    try {
      const { city, country, email, line1, name, postal_code, state, userId } =
        data;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const customer = await stripeClient.customers.create({
        email,
        name,
        address: {
          city,
          country,
          line1,
          postal_code,
          state,
        },
      });

      const { id } = customer;

      const updatedUser = this.prisma.user.update({
        where: { id: userId },
        data: { customerId: id },
      });

      return updatedUser;
    } catch {
      throw new Error('Não foi possível criar usuário');
    }
  }

  async createAccount(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      if (user.accountId) {
        return await stripeClient.accounts.retrieve(user.accountId);
      }

      const account = await stripeClient.accounts.create({});

      await this.prisma.user.update({
        where: { id: decoded.sub },
        data: {
          accountId: account.id,
        },
      });

      return account;
    } catch {
      throw new Error('Não foi possível criar conta de pagamento');
    }
  }

  async createAccountSession(data: CreateAccountSessionDto) {
    try {
      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const accountSession = await stripeClient.accountSessions.create({
        account: data.account,
        components: {
          account_onboarding: { enabled: true },
          account_management: { enabled: true },
          payments: { enabled: true },
          payouts: { enabled: true },
        },
      });

      return {
        client_secret: accountSession.client_secret,
      };
    } catch {
      throw new Error('Não foi possível criar sessão de conta');
    }
  }

  async createCheckoutSession(data: CreateCheckoutSessionDto) {
    try {
      const { priceId, userId } = data;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const subscriptions = await stripeClient.subscriptions.list({
        customer: user.customerId as string,
        status: 'active',
        limit: 1,
      });

      const alreadyCreated = subscriptions.data.length > 0;

      const session = await stripeClient.checkout.sessions.create({
        ui_mode: 'embedded',
        customer: user.customerId as string,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        //TODO: return URL
        return_url: `https://salondash.mangalab.io/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        // return_url: `http://localhost:5173/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        allow_promotion_codes: true,
      });

      return { clientSecret: session.client_secret, alreadyCreated };
    } catch (e) {
      if (e instanceof HttpException) throw e;

      throw new HttpException(
        'Não foi possível criar sessão de pagamento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async retrieveAllProducts() {
    try {
      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const products = await stripeClient.products.list({
        active: true,
        expand: ['data.default_price'],
      });

      return { products };
    } catch {
      throw new Error('Não foi recuperar os produtos');
    }
  }

  async userHasActiveSubscription(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (user.role !== 'ADMIN') {
        return true;
      }
      if (!user.customerId) {
        return false;
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const subscriptions = await stripeClient.subscriptions.list({
        customer: user.customerId,
        status: 'all',
        expand: ['data.default_payment_method'],
      });

      return subscriptions.data.some(
        (sub) => sub.status === 'active' || sub.status === 'trialing',
      );
    } catch {
      throw new Error('Não foi possível recuperar assinaturas');
    }
  }

  async getUserSubscriptions(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.customerId) {
        return [];
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const subscriptions = await stripeClient.subscriptions.list({
        customer: user.customerId,
        status: 'all',
        expand: ['data.default_payment_method'],
      });

      return subscriptions.data;
    } catch {
      throw new Error('Não foi possível recuperar assinaturas');
    }
  }

  async createPortalSession(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.customerId) {
        return {};
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const session = await stripeClient.billingPortal.sessions.create({
        customer: user.customerId,
        return_url:
          'https://salondash.mangalab.io/dashboard?session_id={CHECKOUT_SESSION_ID}',
      });

      return session;
    } catch {
      throw new Error('Não foi criar portal de usuário');
    }
  }

  async createPriceForConnectedAccount(
    token: string,
    value: number,
    planName: string,
  ) {
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.accountId) {
        throw new UnauthorizedException('Onboarding não concluído');
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const product = await stripeClient.products.create(
        { name: planName },
        { stripeAccount: user.accountId },
      );

      const price = await stripeClient.prices.create(
        {
          unit_amount: value * 100,
          currency: 'brl',
          recurring: { interval: 'month' },
          product: product.id,
        },
        {
          stripeAccount: user.accountId,
        },
      );

      return price;
    } catch {
      throw new Error('Não foi criar preço');
    }
  }

  async retrievePricesForConnectedAccount(token: string) {
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.accountId) {
        throw new UnauthorizedException('Onboarding não concluído');
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const prices = await stripeClient.prices.list(
        { active: true, expand: ['data.product'] },
        { stripeAccount: user.accountId },
      );
      return prices.data;
    } catch {
      throw new Error('Não foi recuperar preço');
    }
  }

  async updatePriceForConnectedAccount(
    token: string,
    value: number,
    planName: string,
    planId: string,
    priceId: string,
  ) {
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.accountId) {
        throw new UnauthorizedException('Onboarding não concluído');
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const updatedProduct = await stripeClient.products.update(
        planId,
        { name: planName },
        { stripeAccount: user.accountId },
      );

      const newPrice = await stripeClient.prices.create(
        {
          unit_amount: value * 100,
          currency: 'brl',
          recurring: { interval: 'month' },
          product: planId,
        },
        { stripeAccount: user.accountId },
      );

      await stripeClient.prices.update(
        priceId,
        { active: false },
        { stripeAccount: user.accountId },
      );

      return { newPrice, updatedProduct };
    } catch {
      throw new Error('Não foi atualizar preço');
    }
  }

  async archivePriceForConnectedAccount(token: string, priceId: string) {
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.accountId) {
        throw new UnauthorizedException('Onboarding não concluído');
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const archivedPrice = await stripeClient.prices.update(
        priceId,
        { active: false },
        { stripeAccount: user.accountId },
      );

      return archivedPrice;
    } catch {
      throw new Error('Não foi arquivar preço');
    }
  }

  async priceReadjustmentForConnectedAccount(
    token: string,
    priceId: string,
    value: number,
    productId: string,
  ) {
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.accountId) {
        throw new UnauthorizedException('Onboarding não concluído');
      }

      const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

      const prices = await stripeClient.prices.list(
        {
          product: productId,
          active: true,
          limit: 100,
        },
        { stripeAccount: user.accountId },
      );

      let newPrice = prices.data.find(
        (p) =>
          p.unit_amount === value * 100 && p.recurring?.interval === 'month',
      );

      if (!newPrice) {
        newPrice = await stripeClient.prices.create(
          {
            product: productId,
            currency: 'brl',
            unit_amount: value * 100,
            recurring: { interval: 'month' },
          },
          { stripeAccount: user.accountId },
        );
      }

      let hasMore = true;
      let startingAfter: string | undefined = undefined;

      while (hasMore) {
        const subscriptions = await stripeClient.subscriptions.list(
          {
            price: priceId,
            limit: 100,
            starting_after: startingAfter,
          },
          { stripeAccount: user.accountId },
        );

        for (const subscription of subscriptions.data) {
          if (!subscription.items.data.length) continue;

          await stripeClient.subscriptions.update(
            subscription.id,
            {
              items: [
                {
                  id: subscription.items.data[0].id,
                  price: newPrice.id,
                },
              ],
              proration_behavior: 'create_prorations',
            },
            { stripeAccount: user.accountId },
          );
        }

        hasMore = subscriptions.has_more;
        if (hasMore) {
          startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
        }
      }

      await stripeClient.prices.update(
        priceId,
        { active: false },
        { stripeAccount: user.accountId },
      );
    } catch () {
      throw new Error('Não foi reajustar preço');
    }
  }
}
