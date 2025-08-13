import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import {
  CreateTransactionDto,
  TransactionType,
} from './dto/create-transaction.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { PayRecurringExpenseDto } from './dto/pay-recurring-expense.dto';
import { AuthenticatedRequest } from '../common/middleware/auth.middleware';

@ApiTags('financial')
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // Categorias
  @Post('categories')
  @ApiOperation({ summary: 'Criar categoria financeira' })
  createCategory(
    @Body() body: CreateCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.createCategory(body, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias financeiras' })
  getCategories(
    @Query('type') type: TransactionType,
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.getCategories(
      {
        id: req.user.id,
        role: req.user.role,
        branchId: branchId || req.user.branchId,
      },
      type,
    );
  }

  // Transações
  @Post('transactions')
  @ApiOperation({ summary: 'Criar transação financeira' })
  createTransaction(
    @Body() body: CreateTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.createTransaction(body, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Listar transações financeiras' })
  async getTransactions(
    @Query('type') type: TransactionType,
    @Query('categoryId') categoryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    console.log('Getting transactions with filters:', {
      type,
      categoryId,
      startDate,
      endDate,
      branchId,
    });

    const transactions = await this.financialService.getTransactions(
      {
        id: req.user.id,
        role: req.user.role,
        branchId: branchId || req.user.branchId,
      },
      { type, categoryId, startDate, endDate },
    );

    console.log(`Found ${transactions.length} transactions`);
    console.log(
      'Transactions with Estoque reference:',
      transactions.filter((t) => t.reference?.startsWith('Estoque-')).length,
    );

    return transactions;
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro' })
  getFinancialSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.getFinancialSummary(
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
      startDate,
      endDate,
    );
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Excluir transação' })
  deleteTransaction(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.financialService.deleteTransaction(id, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  // Despesas Fixas
  @Post('recurring-expenses')
  @ApiOperation({ summary: 'Criar despesa fixa' })
  createRecurringExpense(
    @Body() body: CreateRecurringExpenseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.createRecurringExpense(body, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Get('recurring-expenses')
  @ApiOperation({ summary: 'Listar despesas fixas' })
  getRecurringExpenses(
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.getRecurringExpenses({
      id: req.user.id,
      role: req.user.role,
      branchId: branchId || req.user.branchId,
    });
  }

  @Get('recurring-expenses/pending')
  @ApiOperation({ summary: 'Listar despesas fixas pendentes' })
  getPendingRecurringExpenses(@Req() req: AuthenticatedRequest) {
    return this.financialService.getPendingRecurringExpenses({
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Post('recurring-expenses/:id/pay')
  @ApiOperation({ summary: 'Pagar despesa fixa' })
  payRecurringExpense(
    @Param('id') id: string,
    @Body() body: PayRecurringExpenseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.payRecurringExpense(id, body, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Post('generate-salary-expenses')
  @ApiOperation({ summary: 'Gerar despesas de salário automaticamente' })
  generateSalaryExpenses(@Req() req: AuthenticatedRequest) {
    return this.financialService.generateSalaryExpenses({
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }
}
