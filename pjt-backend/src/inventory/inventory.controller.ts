import { Controller, Get, UseGuards, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from '../products/products.service';
import { StockMovement } from '@prisma/client';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('movements')
  getMovements(@Headers('x-branch-id') branchId: string): Promise<StockMovement[]> {
    return this.productsService.getStockMovements(branchId);
  }
}