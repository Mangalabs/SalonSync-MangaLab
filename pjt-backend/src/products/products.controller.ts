import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Product, StockMovement } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @Headers('x-branch-id') branchId: string,
  ): Promise<Product> {
    return this.productsService.create(createProductDto, branchId);
  }

  @Get()
  findAll(@Headers('x-branch-id') branchId: string): Promise<Product[]> {
    return this.productsService.findAll(branchId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('x-branch-id') branchId: string,
  ): Promise<Product> {
    return this.productsService.findOne(id, branchId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Headers('x-branch-id') branchId: string,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto, branchId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-branch-id') branchId: string,
  ): Promise<Product> {
    return this.productsService.remove(id, branchId);
  }

  @Post(':id/adjust')
  adjustStock(
    @Param('id') id: string,
    @Body() adjustStockDto: AdjustStockDto,
    @Headers('x-branch-id') branchId: string,
    @Request() req,
  ): Promise<{ product: Product; movement: StockMovement }> {
    console.log('Adjust stock request:', {
      id,
      adjustStockDto,
      branchId,
      userId: req.user?.id
    });
    
    return this.productsService.adjustStock(
      id,
      adjustStockDto,
      branchId,
      req.user.id,
    );
  }
}