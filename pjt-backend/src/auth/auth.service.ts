import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

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
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
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

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Se for PROFESSIONAL, buscar dados da filial
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
        };
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async updateProfile(
    token: string,
    data: {
      name?: string;
      businessName?: string;
      phone?: string;
    },
  ) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const currentUser = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { role: true },
      });

      // Se for PROFESSIONAL, permitir apenas atualizar telefone
      const updateData =
        currentUser?.role === 'PROFESSIONAL' ? { phone: data.phone } : data;

      const user = await this.prisma.user.update({
        where: { id: decoded.sub },
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

      // Se for PROFESSIONAL, buscar dados da filial
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
        };
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async createEmployee(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    roleId?: string;
    commissionRate?: number;
    branchId: string;
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

    // Verificar se a filial existe
    const branch = await this.prisma.branch.findUnique({
      where: { id: data.branchId },
    });

    if (!branch) {
      throw new ConflictException('Filial não encontrada');
    }

    // Criar Professional automaticamente
    await this.prisma.professional.create({
      data: {
        name: data.name,
        role: data.role || 'Profissional',
        branchId: data.branchId,
        commissionRate: data.commissionRate || 0,
        roleId: data.roleId,
      },
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async createAdmin(data: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    branchName?: string;
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
        businessName: data.businessName,
        role: 'ADMIN',
        isSuperAdmin: false,
      },
    });

    // Criar filial padrão
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
    };
  }

  private generateToken(userId: string): string {
    const secret = this.config.get<string>('JWT_SECRET') || 'secret';
    return jwt.sign({ sub: userId }, secret, { expiresIn: '8h' });
  }
}
