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
    const branchId = branchIds[0]; // Use first branch for creating default categories

    // Check if categories exist for this type and branch
    const existingCategories = await this.prisma.expenseCategory.findMany({
      where: {
        branchId: { in: branchIds },
        ...(type && { type }),
      },
      orderBy: { name: 'asc' },
    });

    // If no categories exist for this type, create default ones
    if (existingCategories.length === 0 && type && branchId) {
      await this.createDefaultCategories(branchId, type);
      
      // Fetch categories again after creating defaults
      return this.prisma.expenseCategory.findMany({
        where: {
          branchId: { in: branchIds },
          ...(type && { type }),
        },
        orderBy: { name: 'asc' },
      });
    }

    return existingCategories;
  }

  private async createDefaultCategories(branchId: string, type: TransactionType) {
    const defaultCategories = {
      INCOME: [
        { name: 'Serviços', color: '#10B981' },
        { name: 'Produtos', color: '#3B82F6' },
        { name: 'Outras Receitas', color: '#8B5CF6' },
      ],
      EXPENSE: [
        { name: 'Aluguel', color: '#EF4444' },
        { name: 'Produtos/Insumos', color: '#F59E0B' },
        { name: 'Salários', color: '#EC4899' },
        { name: 'Contas (Luz, Água, Internet)', color: '#6B7280' },
        { name: 'Marketing', color: '#14B8A6' },
        { name: 'Outras Despesas', color: '#84CC16' },
      ],
      INVESTMENT: [
        { name: 'Equipamentos', color: '#3B82F6' },
        { name: 'Reforma/Decoração', color: '#8B5CF6' },
        { name: 'Capacitação', color: '#10B981' },
        { name: 'Outros Investimentos', color: '#F59E0B' },
      ],
    };

    const categoriesToCreate = defaultCategories[type] || [];
    
    for (const category of categoriesToCreate) {
      await this.prisma.expenseCategory.create({
        data: {
          name: category.name,
          type,
          color: category.color,
          branchId,
        },
      });
    }
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

    dateFilter.gte.setUTCHours(0, 0, 0, 0);
    dateFilter.lte.setUTCHours(23, 59, 59, 999);

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

    // Movimentações de estoque com valores financeiros
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: {
        branchId: { in: branchIds },
        totalCost: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        product: { select: { name: true } },
      },
    });

    // Separar movimentações por tipo
    const stockPurchases = stockMovements
      .filter((m) => m.type === 'IN')
      .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

    const stockSales = stockMovements
      .filter((m) => m.type === 'OUT')
      .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

    const stockLosses = stockMovements
      .filter((m) => m.type === 'LOSS')
      .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

    const summary = {
      totalIncome:
        transactions
          .filter((t) => t.type === 'INCOME')
          .reduce((sum, t) => sum + Number(t.amount), 0) +
        appointmentRevenue +
        stockSales,
      totalExpenses:
        transactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + Number(t.amount), 0) +
        stockPurchases +
        stockLosses,
      totalInvestments: transactions
        .filter((t) => t.type === 'INVESTMENT')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      appointmentRevenue,
      stockRevenue: stockSales,
      stockExpenses: stockPurchases,
      stockLosses,
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
