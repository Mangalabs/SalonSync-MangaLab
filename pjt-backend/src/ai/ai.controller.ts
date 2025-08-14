import { Controller, Get, Query, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { FinancialService } from '../financial/financial.service';
import { ApiOperation } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../common/middleware/auth.middleware';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly financialService: FinancialService,
  ) {}

  @Get('insights')
  @ApiOperation({ summary: 'insights financeiros' })
  async getFinancialSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const finalBranchId = branchId || undefined;
    const summary = await this.financialService.getFinancialSummary(
      {
        id: req.user.id,
        role: req.user.role,
        branchId: finalBranchId,
      },
      startDate,
      endDate,
    );

    return this.aiService.generateInsight(summary);
  }
}
