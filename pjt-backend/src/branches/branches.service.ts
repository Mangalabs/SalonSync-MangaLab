import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAll(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }
    
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };
      
      return this.prisma.branch.findMany({
        where: { ownerId: decoded.sub },
        select: { id: true, name: true, address: true, phone: true },
      });
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async update(id: string, data: {
    name?: string;
    address?: string;
    phone?: string;
  }, token: string) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }
    
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };
      
      return this.prisma.branch.update({
        where: { 
          id,
          ownerId: decoded.sub
        },
        data,
        select: { id: true, name: true, address: true, phone: true },
      });
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}