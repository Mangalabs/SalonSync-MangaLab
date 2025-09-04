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
import { CreateCustomerDto, CreateCheckoutSessionDto } from './dto/payment.dto';

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

      if (subscriptions.data.length > 0) {
        throw new HttpException(
          'Este usuário já possui uma assinatura ativa.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const session = await stripeClient.checkout.sessions.create({
        ui_mode: 'custom',
        customer: user.customerId as string,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        // return_url: `https://salondash.mangalab.io/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        return_url: `http://localhost:5173/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      });

      return { clientSecret: session.client_secret };
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
    } catch (e) {
      console.log(e);
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
    } catch (e) {
      console.log(e);
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
    } catch (e) {
      console.log(e);
      throw new Error('Não foi possível recuperar assinaturas');
    }
  }
}
