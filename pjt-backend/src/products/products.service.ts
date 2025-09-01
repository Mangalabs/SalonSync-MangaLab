import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto, StockMovementType } from './dto/adjust-stock.dto';
import { Product, StockMovement, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProductDto: CreateProductDto,
    branchId: string,
  ): Promise<Product> {
    try {
      console.log('Received DTO:', createProductDto);
      console.log('Branch ID:', branchId);

      const productData: Prisma.ProductCreateInput = {
        name: createProductDto.name,
        category: createProductDto.category,
        brand: createProductDto.brand || null,
        unit: createProductDto.unit || 'un',
        costPrice:
          createProductDto.costPrice !== undefined
            ? createProductDto.costPrice
            : 0,
        salePrice:
          createProductDto.salePrice !== undefined
            ? createProductDto.salePrice
            : 0,
        currentStock:
          createProductDto.initialStock !== undefined
            ? createProductDto.initialStock
            : 0,
        minStock: 0,
        branch: { connect: { id: branchId } },
      };

      console.log('Creating product with data:', productData);

      return this.prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: productData,
        });

        // Criar transação financeira de investimento se há estoque inicial e custo
        const initialStock = createProductDto.initialStock || 0;
        const costPrice = createProductDto.costPrice || 0;

        if (initialStock > 0 && costPrice > 0) {
          await this.createFinancialTransactionForProductCreation(
            createdProduct,
            initialStock,
            costPrice,
            branchId,
            tx,
          );
        }

        console.log('Created product result:', createdProduct);
        return createdProduct;
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    branchId: string,
  ): Promise<Product> {
    await this.findOne(id, branchId);

    console.log('Update product DTO:', updateProductDto);

    // Map DTO fields to match Prisma schema
    const updateData: Prisma.ProductUpdateInput = {};

    if (updateProductDto.name !== undefined)
      updateData.name = updateProductDto.name;
    if (updateProductDto.sku !== undefined)
      updateData.sku = updateProductDto.sku;
    if (updateProductDto.description !== undefined)
      updateData.description = updateProductDto.description;
    if (updateProductDto.category !== undefined)
      updateData.category = updateProductDto.category;
    if (updateProductDto.brand !== undefined)
      updateData.brand = updateProductDto.brand;

    if (updateProductDto.costPrice !== undefined) {
      updateData.costPrice =
        typeof updateProductDto.costPrice === 'string'
          ? parseFloat(updateProductDto.costPrice)
          : updateProductDto.costPrice;
    }

    if (updateProductDto.salePrice !== undefined) {
      updateData.salePrice =
        typeof updateProductDto.salePrice === 'string'
          ? parseFloat(updateProductDto.salePrice)
          : updateProductDto.salePrice;
    }

    if (updateProductDto.currentStock !== undefined) {
      updateData.currentStock =
        typeof updateProductDto.currentStock === 'string'
          ? parseInt(updateProductDto.currentStock, 10)
          : updateProductDto.currentStock;
    }

    if (updateProductDto.minStock !== undefined) {
      updateData.minStock =
        typeof updateProductDto.minStock === 'string'
          ? parseInt(updateProductDto.minStock, 10)
          : updateProductDto.minStock;
    }

    if (updateProductDto.maxStock !== undefined) {
      updateData.maxStock =
        typeof updateProductDto.maxStock === 'string'
          ? parseInt(updateProductDto.maxStock, 10)
          : updateProductDto.maxStock;
    }

    if (updateProductDto.unit !== undefined)
      updateData.unit = updateProductDto.unit;

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
        'Cannot delete product with stock movements. Consider deactivating it instead.',
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

    const { quantity, type, reason, reference, unitCost, soldById } =
      adjustStockDto;

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
            `Insufficient stock. Current: ${product.currentStock}, Requested: ${quantity}`,
          );
        }
        newStock -= quantity;
        break;
      case StockMovementType.LOSS:
        movementType = 'LOSS';
        if (product.currentStock < quantity) {
          throw new BadRequestException(
            `Insufficient stock. Current: ${product.currentStock}, Requested: ${quantity}`,
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
    const totalCost = unitCost
      ? unitCost * quantity
      : movementType === 'LOSS'
        ? Number(product.costPrice) * quantity
        : undefined;

    console.log('Stock movement calculation:', {
      unitCost,
      quantity,
      productCostPrice: product.costPrice,
      calculatedTotalCost: totalCost,
      movementType,
    });

    // Create transaction to update both product and create movement
    return this.prisma.$transaction(async (tx) => {
      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      // Create stock movement record
      const movementData: any = {
        product: { connect: { id } },
        branch: { connect: { id: branchId } },
        type: movementType,
        quantity,
        reason,
        reference,
        unitCost,
        totalCost,
      };

      // Only add user connection if we have a valid user ID
      const userIdToConnect = soldById || userId;
      if (userIdToConnect) {
        movementData.user = { connect: { id: userIdToConnect } };
      }
      // If no user ID, the movement will be created without user association

      let movement;
      try {
        movement = await tx.stockMovement.create({
          data: movementData,
        });
      } catch (error) {
        // If user connection fails, create without user
        if (error.code === 'P2025' && error.meta?.cause?.includes('User')) {
          console.log(
            'User not found, creating movement without user association',
          );
          const { user, ...dataWithoutUser } = movementData;
          movement = await tx.stockMovement.create({
            data: dataWithoutUser,
          });
        } else {
          throw error;
        }
      }

      // Create financial transaction for specific movement types
      await this.createFinancialTransactionForMovement(
        movement,
        updatedProduct,
        branchId,
        tx,
      );

      return {
        product: updatedProduct,
        movement,
      };
    });
  }

  private async createFinancialTransactionForMovement(
    movement: StockMovement,
    product: Product,
    branchId: string,
    tx: any,
  ) {
    console.log('Creating financial transaction for movement:', {
      movementId: movement.id,
      type: movement.type,
      totalCost: movement.totalCost,
      productName: product.name,
    });

    // Only create financial transactions for movements with financial impact
    if (!movement.totalCost || Number(movement.totalCost) <= 0) {
      console.log(
        'Skipping financial transaction - no totalCost or totalCost <= 0',
        {
          totalCost: movement.totalCost,
          unitCost: movement.unitCost,
          quantity: movement.quantity,
        },
      );
      return;
    }

    let transactionType: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | null = null;
    let categoryName = '';
    let description = '';

    switch (movement.type) {
      case 'LOSS':
        transactionType = 'EXPENSE';
        categoryName = 'Perdas de Estoque';
        description = `Perda: ${product.name} (${movement.quantity} ${product.unit}) - ${movement.reason}`;
        break;
      case 'IN':
        transactionType = 'INVESTMENT';
        categoryName = 'Compra de Produtos';
        description = `Entrada: ${product.name} (${movement.quantity} ${product.unit}) - ${movement.reason}`;
        break;
      case 'OUT':
        transactionType = 'INCOME';
        categoryName = 'Venda de Produtos';
        description = `Saída: ${product.name} (${movement.quantity} ${product.unit}) - ${movement.reason}`;
        break;
      default:
        console.log('No financial transaction for ADJUSTMENT type');
        return;
    }

    if (!transactionType) return;

    // Find or create the appropriate category
    let category = await tx.expenseCategory.findFirst({
      where: {
        branchId,
        name: categoryName,
        type: transactionType,
      },
    });

    if (!category) {
      const categoryColors = {
        'Perdas de Estoque': '#DC2626',
        'Compra de Produtos': '#F59E0B',
        'Venda de Produtos': '#10B981',
      };

      category = await tx.expenseCategory.create({
        data: {
          name: categoryName,
          type: transactionType,
          color: categoryColors[categoryName] || '#6B7280',
          branchId,
        },
      });
    }

    // Create the financial transaction
    console.log('Creating financial transaction:', {
      description,
      amount: movement.totalCost,
      type: transactionType,
      categoryName: category.name,
      reference: `Estoque-${movement.id}`,
    });

    const financialTransaction = await tx.financialTransaction.create({
      data: {
        description,
        amount: movement.totalCost,
        type: transactionType,
        categoryId: category.id,
        paymentMethod: 'OTHER',
        reference: `Estoque-${movement.id}`,
        date: movement.createdAt,
        branchId,
      },
    });

    console.log(
      'Financial transaction created successfully:',
      financialTransaction.id,
    );
  }

  private async createFinancialTransactionForProductCreation(
    product: Product,
    initialStock: number,
    costPrice: number,
    branchId: string,
    tx: any,
  ) {
    const totalCost = initialStock * costPrice;

    console.log('Creating financial transaction for product creation:', {
      productId: product.id,
      productName: product.name,
      initialStock,
      costPrice,
      totalCost,
    });

    // Buscar ou criar categoria de investimento
    let category = await tx.expenseCategory.findFirst({
      where: {
        branchId,
        name: 'Compra de Produtos',
        type: 'INVESTMENT',
      },
    });

    if (!category) {
      category = await tx.expenseCategory.create({
        data: {
          name: 'Compra de Produtos',
          type: 'INVESTMENT',
          color: '#F59E0B',
          branchId,
        },
      });
    }

    // Criar transação financeira de investimento
    const financialTransaction = await tx.financialTransaction.create({
      data: {
        description: `Investimento inicial: ${product.name} (${initialStock} ${product.unit})`,
        amount: totalCost,
        type: 'INVESTMENT',
        categoryId: category.id,
        paymentMethod: 'OTHER',
        reference: `Produto-${product.id}`,
        date: new Date(),
        branchId,
      },
    });

    console.log(
      'Investment transaction created successfully:',
      financialTransaction.id,
    );
  }

  async getStockMovements(
    branchId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StockMovement[]> {
    console.log('📈 ProductsService.getStockMovements called with:', {
      branchId,
      startDate,
      endDate,
    });

    const where: any = { branchId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    console.log('📈 Query where clause:', where);

    const movements = await this.prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📈 Found movements:', movements.length, 'movements');
    console.log(
      '📈 Sample movements:',
      movements.slice(0, 2).map((m) => ({
        id: m.id.substring(0, 8),
        type: m.type,
        product: m.product.name,
        quantity: m.quantity,
        createdAt: m.createdAt,
      })),
    );

    return movements;
  }

  async updateStockMovement(
    id: string,
    updateData: {
      productId?: string;
      type?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'LOSS';
      quantity?: number;
      unitCost?: number;
      reason?: string;
      reference?: string;
    },
    userId?: string,
  ) {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!movement) {
      throw new NotFoundException('Movimentação não encontrada');
    }

    const newProductId = updateData.productId || movement.productId;
    const newType = updateData.type || movement.type;
    const newQuantity = updateData.quantity || movement.quantity;
    const totalCost = updateData.unitCost
      ? updateData.unitCost * newQuantity
      : movement.totalCost;

    return this.prisma.$transaction(async (tx) => {
      // Se o produto mudou, reverter estoque do produto antigo
      if (newProductId !== movement.productId) {
        let oldProductStock = movement.product.currentStock;
        switch (movement.type) {
          case 'IN':
            oldProductStock -= movement.quantity;
            break;
          case 'OUT':
          case 'LOSS':
            oldProductStock += movement.quantity;
            break;
        }
        await tx.product.update({
          where: { id: movement.productId },
          data: { currentStock: oldProductStock },
        });

        // Aplicar movimentação no novo produto
        const newProduct = await tx.product.findUnique({
          where: { id: newProductId },
        });
        if (!newProduct) {
          throw new NotFoundException('Novo produto não encontrado');
        }

        let newProductStock = newProduct.currentStock;
        switch (newType) {
          case 'IN':
            newProductStock += newQuantity;
            break;
          case 'OUT':
          case 'LOSS':
            if (newProductStock < newQuantity) {
              throw new BadRequestException(
                'Estoque insuficiente no novo produto',
              );
            }
            newProductStock -= newQuantity;
            break;
          case 'ADJUSTMENT':
            newProductStock = newQuantity;
            break;
        }
        await tx.product.update({
          where: { id: newProductId },
          data: { currentStock: newProductStock },
        });
      } else {
        // Mesmo produto, apenas ajustar diferença
        let currentStock = movement.product.currentStock;

        // Reverter movimentação anterior
        switch (movement.type) {
          case 'IN':
            currentStock -= movement.quantity;
            break;
          case 'OUT':
          case 'LOSS':
            currentStock += movement.quantity;
            break;
        }

        // Aplicar nova movimentação
        switch (newType) {
          case 'IN':
            currentStock += newQuantity;
            break;
          case 'OUT':
          case 'LOSS':
            if (currentStock < newQuantity) {
              throw new BadRequestException('Estoque insuficiente');
            }
            currentStock -= newQuantity;
            break;
          case 'ADJUSTMENT':
            currentStock = newQuantity;
            break;
        }

        await tx.product.update({
          where: { id: movement.productId },
          data: { currentStock },
        });
      }

      // Atualizar a movimentação
      return tx.stockMovement.update({
        where: { id },
        data: {
          productId: newProductId,
          type: newType,
          quantity: newQuantity,
          unitCost: updateData.unitCost || movement.unitCost,
          totalCost,
          reason: updateData.reason || movement.reason,
          reference: updateData.reference || movement.reference,
        },
        include: {
          product: true,
          user: true,
        },
      });
    });
  }

  async deleteStockMovement(id: string, userId?: string) {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!movement) {
      throw new NotFoundException('Movimentação não encontrada');
    }

    // Reverter o efeito da movimentação no estoque
    let currentStock = movement.product.currentStock;
    switch (movement.type) {
      case 'IN':
        currentStock -= movement.quantity;
        break;
      case 'OUT':
      case 'LOSS':
        currentStock += movement.quantity;
        break;
      case 'ADJUSTMENT':
        // Para ajustes, não podemos reverter facilmente
        throw new BadRequestException(
          'Não é possível excluir movimentações de ajuste',
        );
    }

    return this.prisma.$transaction(async (tx) => {
      // Atualizar o produto
      await tx.product.update({
        where: { id: movement.productId },
        data: { currentStock },
      });

      // Excluir a movimentação
      await tx.stockMovement.delete({
        where: { id },
      });

      // Excluir transação financeira relacionada se existir
      await tx.financialTransaction.deleteMany({
        where: { reference: `Estoque-${id}` },
      });
    });
  }
}
