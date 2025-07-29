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
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.getCategories(
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
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
  getTransactions(
    @Query('type') type: TransactionType,
    @Query('categoryId') categoryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.getTransactions(
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
      { type, categoryId, startDate, endDate },
    );
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
}
