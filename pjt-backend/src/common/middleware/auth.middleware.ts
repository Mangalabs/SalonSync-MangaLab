import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '@/prisma/prisma.service';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'PROFESSIONAL';
    branchId?: string; // Para funcionários
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new UnauthorizedException('Token não fornecido');
      }

      const secret = process.env.JWT_SECRET || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };

      // Buscar dados completos do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Se for funcionário, buscar sua filial
      let branchId: string | undefined;
      if (user.role === 'PROFESSIONAL' && user.name) {
        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          select: { branchId: true }
        });
        branchId = professional?.branchId;
      }

      // Preservar o body original da requisição
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role as 'ADMIN' | 'PROFESSIONAL',
        branchId
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      throw new UnauthorizedException('Token inválido');
    }
  }
}