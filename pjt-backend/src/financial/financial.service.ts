import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseDataService,
  UserContext,
} from '../common/services/base-data.service';
import {
  CreateTransactionDto,
  TransactionType,
} from './dto/create-transaction.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class FinancialService extends BaseDataService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Categorias
  async createCategory(
    data: CreateCategoryDto,
    user: UserContext,
    targetBranchId?: string,
  ) {
    const branchId = await this.getTargetBranchId(user, targetBranchId);

    return this.prisma.expenseCategory.create({
      data: {
        name: data.name,
        type: data.type,
        color: data.color || '#6B7280',
        description: data.description,
        branchId,
      },
    });
  }

  async getCategories(user: UserContext, type?: TransactionType) {
    const branchIds = await this.getUserBranchIds(user);

    return this.prisma.expenseCategory.findMany({
      where: {
        branchId: { in: branchIds },
        ...(type && { type }),
      },
      orderBy: { name: 'asc' },
    });
  }

  // Transações
  async createTransaction(
    data: CreateTransactionDto,
    user: UserContext,
    targetBranchId?: string,
  ) {
    const branchId = await this.getTargetBranchId(user, targetBranchId);

    return this.prisma.financialTransaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        paymentMethod: data.paymentMethod || 'CASH',
        reference: data.reference,
        date: data.date ? new Date(data.date) : new Date(),
        branchId,
      },
      include: {
        category: true,
      },
    });
  }

  async getTransactions(
    user: UserContext,
    filters?: {
      type?: TransactionType;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const branchIds = await this.getUserBranchIds(user);

    const where: any = {
      branchId: { in: branchIds },
    };

    if (filters?.type) where.type = filters.type;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    return this.prisma.financialTransaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async getFinancialSummary(
    user: UserContext,
    startDate?: string,
    endDate?: string,
  ) {
    const branchIds = await this.getUserBranchIds(user);

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        branchId: { in: branchIds },
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        category: true,
      },
    });

    // Receitas de atendimentos
    const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId: { in: branchIds },
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length > 0 && { scheduledAt: dateFilter }),
      },
    });

    const appointmentRevenue = appointments.reduce(
      (sum, apt) => sum + Number(apt.total),
      0,
    );

    const summary = {
      totalIncome:
        transactions
          .filter((t) => t.type === 'INCOME')
          .reduce((sum, t) => sum + Number(t.amount), 0) + appointmentRevenue,
      totalExpenses: transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      totalInvestments: transactions
        .filter((t) => t.type === 'INVESTMENT')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      appointmentRevenue,
      netProfit: 0,
    };

    summary.netProfit =
      summary.totalIncome - summary.totalExpenses - summary.totalInvestments;

    return summary;
  }

  async deleteTransaction(id: string, user: UserContext) {
    const branchIds = await this.getUserBranchIds(user);

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id, branchId: { in: branchIds } },
    });

    if (!transaction) {
      throw new Error('Transação não encontrada');
    }

    return this.prisma.financialTransaction.delete({
      where: { id },
    });
  }
}
