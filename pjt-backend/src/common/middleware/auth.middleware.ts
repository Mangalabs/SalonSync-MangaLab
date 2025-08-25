import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '@/prisma/prisma.service';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'PROFESSIONAL';
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
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Determinar branchId baseado no contexto
      let branchId: string | undefined;
      const requestedBranchId = req.headers['x-branch-id'] as string;

      if (user.role === 'PROFESSIONAL' && user.name) {
        // Para funcionários, sempre usar sua filial (ignorar header)
        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          select: { branchId: true },
        });
        branchId = professional?.branchId;
      } else if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        // Para admins, usar header x-branch-id se fornecido
        if (requestedBranchId) {
          // Validar se o admin tem acesso à filial solicitada
          const branch = await this.prisma.branch.findFirst({
            where: {
              id: requestedBranchId,
              ownerId: user.id,
            },
          });
          if (branch) {
            branchId = requestedBranchId;
          } else {
            throw new UnauthorizedException(
              'Acesso negado à filial solicitada',
            );
          }
        } else {
          // Usar primeira filial como fallback
          const branch = await this.prisma.branch.findFirst({
            where: { ownerId: user.id },
            select: { id: true },
          });
          branchId = branch?.id;
        }
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role as 'SUPERADMIN' | 'ADMIN' | 'PROFESSIONAL',
        branchId,
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      throw new UnauthorizedException('Token inválido');
    }
  }
}
