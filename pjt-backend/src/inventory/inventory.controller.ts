import {
  Controller,
  Get,
  Patch,
  Delete,
  UseGuards,
  Headers,
  Query,
  Req,
  Param,
  Body,
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
  async getMovements(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') queryBranchId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<StockMovement[]> {
    console.log('📈 Getting inventory movements:', {
      queryBranchId,
      userBranchId: req.user?.branchId,
      userRole: req.user?.role,
      userId: req.user?.id
    });
    
    // Use the branchId from query parameter directly
    const finalBranchId = queryBranchId || req.user?.branchId;
    
    console.log('📈 Final branch ID for movements:', finalBranchId);
    
    if (!finalBranchId) {
      console.log('⚠️ No branch ID available, returning empty array');
      return [];
    }
    
    return this.productsService.getStockMovements(
      finalBranchId,
      startDate,
      endDate,
    );
  }

  @Patch('movements/:id')
  updateMovement(
    @Param('id') id: string,
    @Body() updateData: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.updateStockMovement(id, updateData, req.user?.id);
  }

  @Delete('movements/:id')
  deleteMovement(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.deleteStockMovement(id, req.user?.id);
  }
}
