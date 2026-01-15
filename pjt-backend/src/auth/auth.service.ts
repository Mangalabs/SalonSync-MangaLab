import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.generateToken(user.id);
    return { token };
  }

  async getProfile(token: string) {
    const userId = await this.decodeAndValidateToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        phone: true,
        avatar: true,
        role: true,
        customerId: true,
        accountId: true,
        theme: true,
        themeMode: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.role === 'PROFESSIONAL' && user.name) {
      const branches = await this.prisma.branch.findMany({
        where: {
          professionals: {
            some: {
              name: user.name,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (branches.length > 0) {
        const professional = await this.prisma.professional.findFirst({
          where: {
            name: user.name,
            branchId: {
              in: branches.map((b) => b.id),
            },
          },
          include: {
            branch: {
              select: { name: true },
            },
          },
          orderBy: {
            id: 'desc',
          },
        });

        if (professional) {
          return {
            ...user,
            branchName: professional.branch.name,
            professionalRole: professional.role,
            canManageOthers: professional.role === 'RECEPTIONIST',
          };
        }
      }
    }

    return user;
  }

  async updateProfile(
    token: string,
    data: {
      name?: string;
      businessName?: string;
      phone?: string;
    },
  ) {
    const userId = await this.decodeAndValidateToken(token);
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const updateData =
      currentUser?.role === 'PROFESSIONAL' ? { phone: data.phone } : data;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });

    if (user.role === 'PROFESSIONAL' && user.name) {
      const professional = await this.prisma.professional.findFirst({
        where: { name: user.name },
        include: {
          branch: {
            select: { name: true },
          },
        },
      });

      return {
        ...user,
        branchName: professional?.branch?.name,
        professionalRole: professional?.role,
        canManageOthers: professional?.role === 'RECEPTIONIST',
      };
    }

    return user;
  }

  async createEmployee(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    roleId?: string;
    commissionRate?: number;
    productCommissionRate?: number;
    branchId: string;
    workingDays?: number[];
    canManageOthers?: boolean;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'PROFESSIONAL',
      },
    });

    const branch = await this.prisma.branch.findUnique({
      where: { id: data.branchId },
    });

    if (!branch) {
      throw new ConflictException('Filial não encontrada');
    }

    const professional = await this.prisma.professional.create({
      data: {
        name: data.name,
        role: data.canManageOthers
          ? 'RECEPTIONIST'
          : data.role || 'Profissional',
        branchId: data.branchId,
        commissionRate: data.commissionRate || 0,
        productCommissionRate: data.productCommissionRate || 0,
        roleId: data.roleId,
      },
    });

    if (data.workingDays && data.workingDays.length > 0) {
      await Promise.all(
        data.workingDays.map((dayOfWeek) =>
          this.prisma.professionalWorkingDay.create({
            data: {
              professionalId: professional.id,
              dayOfWeek,
              startTime: '09:00',
              endTime: '18:00',
              isActive: true,
            },
          }),
        ),
      );
    }

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async createAdmin(data: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    branchName?: string;
    city: string;
    country: string;
    line1: string;
    postal_code: string;
    state: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const stripeClient = new Stripe(process.env.STRIPE_API_KEY || '');

    const { city, country, email, line1, name, postal_code, state } = data;

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

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        businessName: data.businessName,
        role: 'ADMIN',
        isSuperAdmin: false,
        customerId: id,
      },
    });

    await this.prisma.branch.create({
      data: {
        name: data.branchName || 'Matriz',
        ownerId: user.id,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      role: user.role,
      customerId: user.customerId,
    };
  }

  private generateToken(userId: string): string {
    const secret = this.config.get<string>('JWT_SECRET') || 'secret';
    return jwt.sign({ sub: userId }, secret, { expiresIn: '8h' });
  }

  private getJwtSecret(): string {
    return this.config.get<string>('JWT_SECRET') || 'secret';
  }

  private async decodeAndValidateToken(token: string): Promise<string> {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const secret = this.getJwtSecret();
      const decoded = jwt.verify(token, secret) as { sub: string };
      return decoded.sub;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
