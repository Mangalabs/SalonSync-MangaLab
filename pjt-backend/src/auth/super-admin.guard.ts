import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };
      
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, isSuperAdmin: true, role: true }
      });

      if (!user || !user.isSuperAdmin) {
        throw new ForbiddenException('Acesso negado: apenas superadmin');
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido');
    }
  }
}