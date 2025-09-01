import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface UserContext {
  id: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'PROFESSIONAL';
  branchId?: string;
}

@Injectable()
export class BaseDataService {
  constructor(protected prisma: PrismaService) {}

  /**
   * Determina quais filiais o usuário pode acessar
   */
  async getUserBranchIds(user: UserContext): Promise<string[]> {
    if (user.role === 'ADMIN') {
      // Admin: todas suas filiais
      const branches = await this.prisma.branch.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });
      return branches.map((b) => b.id);
    } else if (user.role === 'SUPERADMIN') {
      // Admin: todas suas filiais
      const branches = await this.prisma.branch.findMany({
        select: { id: true },
      });
      return branches.map((b) => b.id);
    } else {
      // Professional: apenas sua filial
      return user.branchId ? [user.branchId] : [];
    }
  }

  /**
   * Determina a filial para criação de dados
   */
  async getTargetBranchId(
    user: UserContext,
    targetBranchId?: string,
  ): Promise<string> {
    if (targetBranchId) {
      // Verificar se o usuário tem acesso à filial especificada
      const allowedBranchIds = await this.getUserBranchIds(user);
      if (!allowedBranchIds.includes(targetBranchId)) {
        throw new Error('Acesso negado à filial especificada');
      }
      return targetBranchId;
    }

    if (user.role === 'ADMIN') {
      // Admin: usar primeira filial
      const branch = await this.prisma.branch.findFirst({
        where: { ownerId: user.id },
      });
      if (!branch) {
        throw new Error('Nenhuma filial encontrada para este usuário');
      }
      return branch.id;
    } else if (user.role === 'SUPERADMIN') {
      // Admin: usar primeira filial
      const branch = await this.prisma.branch.findFirst();
      if (!branch) {
        throw new Error('Nenhuma filial encontrada para este usuário');
      }
      return branch.id;
    } else {
      // Professional: usar sua filial
      if (!user.branchId) {
        throw new Error('Filial não encontrada para este funcionário');
      }
      return user.branchId;
    }
  }
}
