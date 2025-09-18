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
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { PayRecurringExpenseDto } from './dto/pay-recurring-expense.dto';

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
    const allBranchIds = await this.getUserBranchIds(user);
    const branchIds = user.branchId ? [user.branchId] : allBranchIds;

    // Check if categories exist for this type and branch
    const existingCategories = await this.prisma.expenseCategory.findMany({
      where: {
        branchId: { in: branchIds },
        ...(type && { type }),
      },
      orderBy: { name: 'asc' },
    });

    // If no categories exist for this type, create default ones for each branch
    if (existingCategories.length === 0 && type) {
      for (const branchId of branchIds) {
        await this.createDefaultCategories(branchId, type);
      }

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

  private async createDefaultCategories(
    branchId: string,
    type: TransactionType,
  ) {
    const defaultCategories = {
      INCOME: [
        { name: 'Serviços', color: '#10B981' },
        { name: 'Venda de Produtos', color: '#10B981' },
        { name: 'Outras Receitas', color: '#8B5CF6' },
      ],
      EXPENSE: [
        { name: 'Produtos/Insumos', color: '#F59E0B' },
        { name: 'Perdas de Estoque', color: '#DC2626' },
        { name: 'Salários', color: '#EC4899' },
        { name: 'Comissões', color: '#8B5CF6' },
        { name: 'Outras Despesas', color: '#84CC16' },
      ],
      RECURRING: [
        { name: 'Mensal', color: '#3B82F6' },
        { name: 'Semanal', color: '#10B981' },
        { name: 'Quinzenal', color: '#F59E0B' },
        { name: 'Bimestral', color: '#8B5CF6' },
        { name: 'Trimestral', color: '#EF4444' },
        { name: 'Semestral', color: '#EC4899' },
        { name: 'Anual', color: '#6B7280' },
      ],
      INVESTMENT: [
        { name: 'Equipamentos', color: '#3B82F6' },
        { name: 'Compra de Produtos', color: '#F59E0B' },
        { name: 'Reforma/Decoração', color: '#8B5CF6' },
        { name: 'Capacitação', color: '#10B981' },
        { name: 'Outros Investimentos', color: '#6366F1' },
      ],
    };

    const categoriesToCreate = defaultCategories[type] || [];
    
    // Para despesas fixas, criar categorias de período
    if (type === 'EXPENSE') {
      const recurringCategories = defaultCategories['RECURRING'] || [];
      for (const category of recurringCategories) {
        await this.prisma.expenseCategory.create({
          data: {
            name: category.name,
            type: 'RECURRING',
            color: category.color,
            branchId,
          },
        });
      }
    }

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
    const allBranchIds = await this.getUserBranchIds(user);
    const branchIds = user.branchId ? [user.branchId] : allBranchIds;

    console.log('getTransactions branchIds:', {
      userBranchId: user.branchId,
      allBranchIds,
      finalBranchIds: branchIds,
    });

    const where: any = {
      branchId: { in: branchIds },
    };

    if (filters?.type) where.type = filters.type;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate)
        where.date.gte = new Date(filters.startDate + 'T00:00:00.000Z');
      if (filters.endDate)
        where.date.lte = new Date(filters.endDate + 'T23:59:59.999Z');
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
    const allBranchIds = await this.getUserBranchIds(user);
    // Se branchId foi especificado no contexto, usar apenas essa filial
    // Senão, usar todas as filiais do usuário
    const branchIds = user.branchId ? [user.branchId] : allBranchIds;

    console.log('Financial Summary Service:', {
      userBranchId: user.branchId,
      allBranchIds,
      finalBranchIds: branchIds,
    });

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate + 'T00:00:00.000Z');
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        branchId: { in: branchIds },
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        category: true,
      },
    });

    console.log('Financial transactions found:', {
      total: transactions.length,
      byBranch: transactions.reduce(
        (acc, t) => {
          acc[t.branchId] = (acc[t.branchId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      stockRelated: transactions.filter(
        (t) =>
          t.reference?.startsWith('Estoque-') ||
          t.reference?.startsWith('Produto-'),
      ).length,
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

    console.log('Stock movements found:', {
      total: stockMovements.length,
      byBranch: stockMovements.reduce(
        (acc, m) => {
          acc[m.branchId] = (acc[m.branchId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byType: stockMovements.reduce(
        (acc, m) => {
          acc[m.type] = (acc[m.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    });

    // Despesas fixas pagas no período
    const recurringExpenseTransactions =
      await this.prisma.financialTransaction.findMany({
        where: {
          branchId: { in: branchIds },
          recurringExpenseId: { not: null },
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
        include: {
          recurringExpense: true,
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

    const recurringExpensesTotal = recurringExpenseTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    // Separar transações por origem
    const stockRelatedTransactions = transactions.filter(
      (t) =>
        t.reference?.startsWith('Estoque-') ||
        t.reference?.startsWith('Produto-'),
    );
    const manualTransactions = transactions.filter(
      (t) =>
        !t.reference?.startsWith('Estoque-') &&
        !t.reference?.startsWith('Produto-'),
    );

    const manualIncomeTransactions = manualTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const manualExpenseTransactions = manualTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const manualInvestmentTransactions = manualTransactions
      .filter((t) => t.type === 'INVESTMENT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Transações automáticas do estoque
    const stockIncomeTransactions = stockRelatedTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const stockExpenseTransactions = stockRelatedTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const stockInvestmentTransactions = stockRelatedTransactions
      .filter((t) => t.type === 'INVESTMENT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const summary = {
      totalIncome:
        manualIncomeTransactions + appointmentRevenue + stockIncomeTransactions,
      totalExpenses: manualExpenseTransactions + stockExpenseTransactions,
      totalInvestments:
        manualInvestmentTransactions + stockInvestmentTransactions,
      recurringExpenses: recurringExpensesTotal,
      appointmentRevenue,
      stockRevenue: stockIncomeTransactions,
      stockExpenses: stockInvestmentTransactions,
      stockLosses: stockExpenseTransactions,
      netProfit: 0,
    };

    console.log('Summary calculation:', {
      manualIncome: manualIncomeTransactions,
      manualExpenses: manualExpenseTransactions,
      manualInvestments: manualInvestmentTransactions,
      stockIncomeTransactions,
      stockExpenseTransactions,
      stockInvestmentTransactions,
      appointmentRevenue,
      stockSales,
      stockPurchases,
      stockLosses,
      stockRelatedTransactionsCount: stockRelatedTransactions.length,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      totalInvestments: summary.totalInvestments,
    });

    summary.netProfit =
      summary.totalIncome -
      summary.totalExpenses -
      summary.totalInvestments -
      summary.recurringExpenses;

    return summary;
  }

  async updateTransaction(
    id: string,
    data: CreateTransactionDto,
    user: UserContext,
    targetBranchId?: string,
  ) {
    const branchIds = await this.getUserBranchIds(user);

    const existingTransaction = await this.prisma.financialTransaction.findFirst({
      where: { id, branchId: { in: branchIds } },
    });

    if (!existingTransaction) {
      throw new Error('Transação não encontrada');
    }

    // Não permitir edição de transações automáticas do estoque
    if (existingTransaction.reference?.startsWith('Estoque-') || existingTransaction.reference?.startsWith('Produto-')) {
      throw new Error('Não é possível editar transações automáticas do estoque');
    }

    const branchId = targetBranchId || existingTransaction.branchId;

    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        paymentMethod: data.paymentMethod || 'CASH',
        reference: data.reference,
        date: data.date ? new Date(data.date) : existingTransaction.date,
        branchId,
      },
      include: {
        category: true,
      },
    });
  }

  async deleteTransaction(id: string, user: UserContext) {
    const branchIds = await this.getUserBranchIds(user);

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id, branchId: { in: branchIds } },
    });

    if (!transaction) {
      throw new Error('Transação não encontrada');
    }

    // Não permitir exclusão de transações automáticas do estoque
    if (transaction.reference?.startsWith('Estoque-') || transaction.reference?.startsWith('Produto-')) {
      throw new Error('Não é possível excluir transações automáticas do estoque');
    }

    return this.prisma.financialTransaction.delete({
      where: { id },
    });
  }

  // Despesas Fixas
  async createRecurringExpense(
    data: CreateRecurringExpenseDto,
    user: UserContext,
    targetBranchId?: string,
  ) {
    const branchId = await this.getTargetBranchId(user, targetBranchId);

    // Mapear categorias fixas para nomes reais
    const categoryMap: Record<string, { name: string; color: string }> = {
      aluguel: { name: 'Aluguel', color: '#EF4444' },
      energia: { name: 'Energia Elétrica', color: '#DC2626' },
      agua: { name: 'Água', color: '#B91C1C' },
      internet: { name: 'Internet/Telefone', color: '#991B1B' },
      'salarios-comissoes': { name: 'Salários/Comissões', color: '#F97316' },
      beneficios: { name: 'Benefícios', color: '#C2410C' },
      impostos: { name: 'Impostos e Taxas', color: '#4B5563' },
      seguros: { name: 'Seguros', color: '#6B7280' },
      manutencao: { name: 'Manutenção Preventiva', color: '#374151' },
      software: { name: 'Software/Sistemas', color: '#1E3A8A' },
      outras: { name: 'Outras Despesas Fixas', color: '#6B7280' },
    };

    const categoryInfo = categoryMap[data.categoryId];
    if (!categoryInfo) {
      throw new Error('Categoria inválida');
    }

    // Buscar ou criar categoria
    let category = await this.prisma.expenseCategory.findFirst({
      where: {
        branchId,
        name: categoryInfo.name,
        type: 'EXPENSE',
      },
    });

    if (!category) {
      category = await this.prisma.expenseCategory.create({
        data: {
          name: categoryInfo.name,
          type: 'EXPENSE',
          color: categoryInfo.color,
          branchId,
        },
      });
    }

    return this.prisma.recurringExpense.create({
      data: {
        name: data.name,
        description: data.description,
        categoryId: category.id,
        fixedAmount: data.fixedAmount,
        receiptDay: data.receiptDay,
        dueDay: data.dueDay,
        isActive: data.isActive ?? true,
        professionalId: data.professionalId,
        branchId,
      },
      include: {
        category: true,
        professional: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getRecurringExpenses(user: UserContext) {
    const branchIds = await this.getUserBranchIds(user);

    const expenses = await this.prisma.recurringExpense.findMany({
      where: {
        branchId: { in: branchIds },
        isActive: true,
      },
      include: {
        category: true,
        professional: {
          select: {
            id: true,
            name: true,
            commissionRate: true,
            customRole: {
              select: {
                baseSalary: true,
                commissionRate: true,
              },
            },
          },
        },
      },
      orderBy: { receiptDay: 'asc' },
    });

    // Recalcular valores para despesas de salário/comissão
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const expensesWithCalculated = await Promise.all(
      expenses.map(async (expense) => {
        if (expense.category.name === 'Salários/Comissões' && expense.professional) {
          // Buscar atendimentos do mês atual
          const appointments = await this.prisma.appointment.findMany({
            where: {
              professionalId: expense.professional.id,
              status: 'COMPLETED',
              scheduledAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          });

          const baseSalary = Number(expense.professional.customRole?.baseSalary || 0);
          const commissionRate = Number(expense.professional.customRole?.commissionRate || expense.professional.commissionRate || 0) / 100;
          const totalRevenue = appointments.reduce((sum, apt) => sum + Number(apt.total), 0);
          const currentMonthCommissions = totalRevenue * commissionRate;
          
          return {
            ...expense,
            calculatedAmount: baseSalary + currentMonthCommissions,
          };
        }
        return expense;
      })
    );

    return expensesWithCalculated;
  }

  async updateRecurringExpense(
    id: string,
    data: CreateRecurringExpenseDto,
    user: UserContext,
    targetBranchId?: string,
  ) {
    const branchIds = await this.getUserBranchIds(user);

    const existingExpense = await this.prisma.recurringExpense.findFirst({
      where: { id, branchId: { in: branchIds } },
    });

    if (!existingExpense) {
      throw new Error('Despesa fixa não encontrada');
    }

    const branchId = targetBranchId || existingExpense.branchId;

    // Mapear categorias fixas para nomes reais
    const categoryMap: Record<string, { name: string; color: string }> = {
      aluguel: { name: 'Aluguel', color: '#EF4444' },
      energia: { name: 'Energia Elétrica', color: '#DC2626' },
      agua: { name: 'Água', color: '#B91C1C' },
      internet: { name: 'Internet/Telefone', color: '#991B1B' },
      'salarios-comissoes': { name: 'Salários/Comissões', color: '#F97316' },
      beneficios: { name: 'Benefícios', color: '#C2410C' },
      impostos: { name: 'Impostos e Taxas', color: '#4B5563' },
      seguros: { name: 'Seguros', color: '#6B7280' },
      manutencao: { name: 'Manutenção Preventiva', color: '#374151' },
      software: { name: 'Software/Sistemas', color: '#1E3A8A' },
      outras: { name: 'Outras Despesas Fixas', color: '#6B7280' },
    };

    const categoryInfo = categoryMap[data.categoryId];
    if (!categoryInfo) {
      throw new Error('Categoria inválida');
    }

    // Buscar ou criar categoria
    let category = await this.prisma.expenseCategory.findFirst({
      where: {
        branchId,
        name: categoryInfo.name,
        type: 'EXPENSE',
      },
    });

    if (!category) {
      category = await this.prisma.expenseCategory.create({
        data: {
          name: categoryInfo.name,
          type: 'EXPENSE',
          color: categoryInfo.color,
          branchId,
        },
      });
    }

    return this.prisma.recurringExpense.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        categoryId: category.id,
        fixedAmount: data.fixedAmount,
        receiptDay: data.receiptDay,
        dueDay: data.dueDay,
        professionalId: data.professionalId,
        branchId,
      },
      include: {
        category: true,
        professional: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteRecurringExpense(id: string, user: UserContext) {
    const branchIds = await this.getUserBranchIds(user);

    const expense = await this.prisma.recurringExpense.findFirst({
      where: { id, branchId: { in: branchIds } },
    });

    if (!expense) {
      throw new Error('Despesa fixa não encontrada');
    }

    return this.prisma.recurringExpense.delete({
      where: { id },
    });
  }

  async getPendingRecurringExpenses(user: UserContext) {
    const branchIds = await this.getUserBranchIds(user);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Buscar todas as despesas fixas ativas
    const recurringExpenses = await this.prisma.recurringExpense.findMany({
      where: {
        branchId: { in: branchIds },
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    // Filtrar despesas que estão no período de cobrança (receiptDay <= hoje <= dueDay)
    const expensesInPeriod = recurringExpenses.filter(
      (expense) =>
        expense.receiptDay <= currentDay && currentDay <= expense.dueDay,
    );

    if (expensesInPeriod.length === 0) return [];

    // Buscar pagamentos do mês atual
    const expenseIds = expensesInPeriod.map((e) => e.id);
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        recurringExpenseId: { in: expenseIds },
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    });

    // Retornar apenas despesas não pagas
    return expensesInPeriod.filter(
      (expense) =>
        !transactions.some((t) => t.recurringExpenseId === expense.id),
    );
  }

  async payRecurringExpense(
    recurringExpenseId: string,
    data: PayRecurringExpenseDto,
    user: UserContext,
  ) {
    const branchIds = await this.getUserBranchIds(user);

    const recurringExpense = await this.prisma.recurringExpense.findFirst({
      where: {
        id: recurringExpenseId,
        branchId: { in: branchIds },
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    if (!recurringExpense) {
      throw new Error('Despesa fixa não encontrada');
    }

    // Verificar se já foi paga no mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const existingPayment = await this.prisma.financialTransaction.findFirst({
      where: {
        recurringExpenseId,
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    });

    if (existingPayment) {
      throw new Error('Esta despesa já foi paga neste mês');
    }

    // Criar transação financeira
    return this.prisma.financialTransaction.create({
      data: {
        description: `${recurringExpense.name} - ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
        amount: data.amount,
        type: 'EXPENSE',
        categoryId: recurringExpense.categoryId,
        paymentMethod: data.paymentMethod || 'CASH',
        reference: data.reference,
        recurringExpenseId,
        branchId: recurringExpense.branchId,
      },
      include: {
        category: true,
        recurringExpense: true,
      },
    });
  }

  async generateSalaryExpenses(user: UserContext) {
    const branchIds = await this.getUserBranchIds(user);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Buscar profissionais com função que tem salário configurado e dia de pagamento hoje
    const professionals = await this.prisma.professional.findMany({
      where: {
        branchId: { in: branchIds },
        active: true,
        customRole: {
          baseSalary: { not: null },
          salaryPayDay: currentDay,
        },
      },
      include: {
        customRole: true,
      },
    });

    const results: any[] = [];

    for (const professional of professionals) {
      // Verificar se já foi pago neste mês
      const existingPayment = await this.prisma.financialTransaction.findFirst({
        where: {
          reference: `Salario-${professional.id}-${currentYear}-${currentMonth + 1}`,
        },
      });

      if (existingPayment) continue;

      // Buscar comissões do profissional no mês atual
      const commissions = await this.prisma.financialTransaction.findMany({
        where: {
          appointmentId: { not: null },
          branchId: professional.branchId,
          date: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1),
          },
          appointment: {
            professionalId: professional.id,
          },
        },
      });

      const totalCommissions = commissions.reduce(
        (sum, c) => sum + Number(c.amount),
        0,
      );
      const baseSalary = Number(professional.customRole?.baseSalary || 0);
      const totalSalary = baseSalary + totalCommissions;

      // Buscar ou criar categoria de salários
      let salaryCategory = await this.prisma.expenseCategory.findFirst({
        where: {
          branchId: professional.branchId,
          name: 'Salários',
          type: 'EXPENSE',
        },
      });

      if (!salaryCategory) {
        salaryCategory = await this.prisma.expenseCategory.create({
          data: {
            name: 'Salários',
            type: 'EXPENSE',
            color: '#EC4899',
            branchId: professional.branchId,
          },
        });
      }

      // Criar transação de salário
      const transaction = await this.prisma.financialTransaction.create({
        data: {
          description: `Salário: ${professional.name} - ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          amount: totalSalary,
          type: 'EXPENSE',
          categoryId: salaryCategory.id,
          paymentMethod: 'OTHER',
          reference: `Salario-${professional.id}-${currentYear}-${currentMonth + 1}`,
          date: now,
          branchId: professional.branchId,
        },
      });

      results.push({
        professional: professional.name,
        role: professional.customRole?.title,
        baseSalary,
        commissions: totalCommissions,
        totalSalary,
        transactionId: transaction.id,
      });
    }

    return {
      message: `${results.length} salários processados`,
      results,
    };
  }


}
