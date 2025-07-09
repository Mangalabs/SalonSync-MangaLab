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

  async register(data: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    branches: { name: string }[];
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
      },
    });

    for (const branch of data.branches) {
      await this.prisma.branch.create({
        data: {
          name: branch.name || 'Matriz',
          ownerId: user.id,
        },
      });
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
          avatar: true 
        },
      });
      
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }
      
      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async updateProfile(token: string, data: {
    name?: string;
    businessName?: string;
    phone?: string;
  }) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }
    
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };
      
      const user = await this.prisma.user.update({
        where: { id: decoded.sub },
        data,
        select: { 
          id: true, 
          email: true, 
          name: true, 
          businessName: true, 
          phone: true, 
          avatar: true 
        },
      });
      
      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private generateToken(userId: string): string {
    const secret = this.config.get<string>('JWT_SECRET') || 'secret';
    return jwt.sign({ sub: userId }, secret, { expiresIn: '1h' });
  }
}
