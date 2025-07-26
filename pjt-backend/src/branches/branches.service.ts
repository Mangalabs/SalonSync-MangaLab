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
      
      // Buscar usuário para verificar role
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { role: true, name: true }
      });
      
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }
      
      if (user.role === 'ADMIN') {
        // Admin: retornar suas filiais
        return this.prisma.branch.findMany({
          where: { ownerId: decoded.sub },
          select: { id: true, name: true, address: true, phone: true },
        });
      } else {
        // Professional: retornar filial onde trabalha
        if (!user.name) {
          return [];
        }
        
        const professional = await this.prisma.professional.findFirst({
          where: { name: user.name },
          include: {
            branch: {
              select: { id: true, name: true, address: true, phone: true }
            }
          }
        });
        
        return professional?.branch ? [professional.branch] : [];
      }
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async create(data: {
    name: string;
    address?: string;
    phone?: string;
  }, token: string) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }
    
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };
      
      return this.prisma.branch.create({
        data: {
          ...data,
          ownerId: decoded.sub
        },
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

  async delete(id: string, token: string) {
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }
    
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { sub: string };
      
      await this.prisma.branch.delete({
        where: { 
          id,
          ownerId: decoded.sub
        }
      });
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}