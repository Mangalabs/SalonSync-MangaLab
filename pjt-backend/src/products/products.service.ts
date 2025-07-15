import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto, StockMovementType } from './dto/adjust-stock.dto';
import { Product, StockMovement, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, branchId: string): Promise<Product> {
    try {
      // Map DTO fields to match Prisma schema
      const productData: Prisma.ProductCreateInput = {
        name: createProductDto.name,
        sku: createProductDto.sku,
        description: createProductDto.description,
        category: createProductDto.category || 'Geral',
        brand: createProductDto.brand,
        costPrice: typeof createProductDto.costPrice === 'string' 
          ? parseFloat(createProductDto.costPrice) 
          : createProductDto.costPrice,
        salePrice: typeof createProductDto.salePrice === 'string' 
          ? parseFloat(createProductDto.salePrice) 
          : createProductDto.salePrice,
        currentStock: typeof createProductDto.currentStock === 'string' 
          ? parseInt(createProductDto.currentStock, 10) 
          : createProductDto.currentStock || 0,
        minStock: typeof createProductDto.minStock === 'string' 
          ? parseInt(createProductDto.minStock, 10) 
          : createProductDto.minStock || 0,
        maxStock: createProductDto.maxStock !== undefined 
          ? (typeof createProductDto.maxStock === 'string' 
            ? parseInt(createProductDto.maxStock, 10) 
            : createProductDto.maxStock) 
          : undefined,
        unit: createProductDto.unit || 'un',
        branch: { connect: { id: branchId } }
      };
      
      console.log('Creating product with data:', productData);
      
      return this.prisma.product.create({
        data: productData
      });
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async findAll(branchId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { branchId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, branchId: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, branchId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, branchId: string): Promise<Product> {
    await this.findOne(id, branchId);
    
    console.log('Update product DTO:', updateProductDto);
    
    // Map DTO fields to match Prisma schema
    const updateData: Prisma.ProductUpdateInput = {};
    
    if (updateProductDto.name !== undefined) updateData.name = updateProductDto.name;
    if (updateProductDto.sku !== undefined) updateData.sku = updateProductDto.sku;
    if (updateProductDto.description !== undefined) updateData.description = updateProductDto.description;
    if (updateProductDto.category !== undefined) updateData.category = updateProductDto.category;
    if (updateProductDto.brand !== undefined) updateData.brand = updateProductDto.brand;
    
    if (updateProductDto.costPrice !== undefined) {
      updateData.costPrice = typeof updateProductDto.costPrice === 'string' 
        ? parseFloat(updateProductDto.costPrice) 
        : updateProductDto.costPrice;
    }
    
    if (updateProductDto.salePrice !== undefined) {
      updateData.salePrice = typeof updateProductDto.salePrice === 'string' 
        ? parseFloat(updateProductDto.salePrice) 
        : updateProductDto.salePrice;
    }
    
    if (updateProductDto.currentStock !== undefined) {
      updateData.currentStock = typeof updateProductDto.currentStock === 'string' 
        ? parseInt(updateProductDto.currentStock, 10) 
        : updateProductDto.currentStock;
    }
    
    if (updateProductDto.minStock !== undefined) {
      updateData.minStock = typeof updateProductDto.minStock === 'string' 
        ? parseInt(updateProductDto.minStock, 10) 
        : updateProductDto.minStock;
    }
    
    if (updateProductDto.maxStock !== undefined) {
      updateData.maxStock = typeof updateProductDto.maxStock === 'string' 
        ? parseInt(updateProductDto.maxStock, 10) 
        : updateProductDto.maxStock;
    }
    
    if (updateProductDto.unit !== undefined) updateData.unit = updateProductDto.unit;

    console.log('Update data to be sent to Prisma:', updateData);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
    
    console.log('Updated product result:', updatedProduct);
    
    return updatedProduct;
  }

  async remove(id: string, branchId: string): Promise<Product> {
    await this.findOne(id, branchId);

    // Check if there are stock movements for this product
    const movementsCount = await this.prisma.stockMovement.count({
      where: { productId: id },
    });

    if (movementsCount > 0) {
      throw new BadRequestException(
        'Cannot delete product with stock movements. Consider deactivating it instead.'
      );
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async adjustStock(
    id: string,
    adjustStockDto: AdjustStockDto,
    branchId: string,
    userId: string,
  ): Promise<{ product: Product; movement: StockMovement }> {
    const product = await this.findOne(id, branchId);

    const { quantity, type, reason, reference, unitCost } = adjustStockDto;

    // Calculate new stock level
    let newStock = product.currentStock;
    
    // Convert enum from DTO to Prisma enum
    let movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'LOSS';
    
    switch (type) {
      case StockMovementType.IN:
        movementType = 'IN';
        newStock += quantity;
        break;
      case StockMovementType.OUT:
        movementType = 'OUT';
        if (product.currentStock < quantity) {
          throw new BadRequestException(
            `Insufficient stock. Current: ${product.currentStock}, Requested: ${quantity}`
          );
        }
        newStock -= quantity;
        break;
      case StockMovementType.LOSS:
        movementType = 'LOSS';
        if (product.currentStock < quantity) {
          throw new BadRequestException(
            `Insufficient stock. Current: ${product.currentStock}, Requested: ${quantity}`
          );
        }
        newStock -= quantity;
        break;
      case StockMovementType.ADJUSTMENT:
        movementType = 'ADJUSTMENT';
        // For adjustments, the quantity is the absolute new value
        newStock = quantity;
        break;
    }

    // Calculate total cost if unit cost is provided
    const totalCost = unitCost ? unitCost * quantity : undefined;

    // Create transaction to update both product and create movement
    return this.prisma.$transaction(async (tx) => {
      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          product: { connect: { id } },
          branch: { connect: { id: branchId } },
          type: movementType,
          quantity,
          reason,
          reference,
          unitCost,
          totalCost,
        },
      });

      return {
        product: updatedProduct,
        movement,
      };
    });
  }

  async getStockMovements(branchId: string): Promise<StockMovement[]> {
    return this.prisma.stockMovement.findMany({
      where: { branchId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}