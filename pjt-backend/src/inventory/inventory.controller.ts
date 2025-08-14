import {
  Controller,
  Get,
  UseGuards,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from '../products/products.service';
import { StockMovement } from '@prisma/client';
import { AuthenticatedRequest } from '../common/middleware/auth.middleware';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('movements')
  getMovements(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<StockMovement[]> {
    const finalBranchId = branchId || req.user.branchId || '';
    return this.productsService.getStockMovements(
      finalBranchId,
      startDate,
      endDate,
    );
  }
}
