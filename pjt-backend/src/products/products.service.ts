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
          createProductDto.productType === 'PROFESSIONAL_USE'
            ? Number(createProductDto.unitWeight) || 0
            : createProductDto.initialStock !== undefined
              ? createProductDto.initialStock
              : 0,
        minStock:
          createProductDto.minStock !== undefined
            ? createProductDto.minStock
            : 0,
        productType: createProductDto.productType || 'SALE',
        unitWeight: createProductDto.unitWeight || null,
        markupPercent: createProductDto.markupPercent || null,
        branch: { connect: { id: branchId } },
      };

      return this.prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: productData,
        });

        const initialStock = createProductDto.initialStock || 0;
        const costPrice = createProductDto.costPrice || 0;

        if (initialStock > 0) {
          const movement = await tx.stockMovement.create({
            data: {
              product: { connect: { id: createdProduct.id } },
              branch: { connect: { id: branchId } },
              type: 'IN',
              quantity: initialStock,
              unitCost: costPrice > 0 ? costPrice : null,
              totalCost: costPrice > 0 ? costPrice * initialStock : null,
              reason: 'Estoque inicial do produto',
              reference: `Produto-${createdProduct.id}`,
            },
          });

          if (costPrice > 0) {
            await this.createFinancialTransactionForProductCreation(
              createdProduct,
              initialStock,
              costPrice,
              branchId,
              tx,
            );
          }
        }

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
    const currentProduct = await this.findOne(id, branchId);

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

    let newStock: number | undefined;
    if (updateProductDto.currentStock !== undefined) {
      newStock =
        typeof updateProductDto.currentStock === 'string'
          ? parseInt(updateProductDto.currentStock, 10)
          : updateProductDto.currentStock;
      updateData.currentStock = newStock;
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

    if (updateProductDto.productType !== undefined)
      updateData.productType = updateProductDto.productType;

    if (updateProductDto.unitWeight !== undefined)
      updateData.unitWeight = updateProductDto.unitWeight;

    if (updateProductDto.markupPercent !== undefined)
      updateData.markupPercent = updateProductDto.markupPercent;

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    return updatedProduct;
  }

  async remove(id: string, branchId: string): Promise<Product> {
    await this.findOne(id, branchId);

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

    let newStock = Number(product.currentStock);

    let movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'LOSS' | 'PROFESSIONAL_USE';

    switch (type) {
      case StockMovementType.IN:
        movementType = 'IN';
        newStock += quantity;
        break;
      case StockMovementType.OUT:
        movementType = 'OUT';
        if (Number(product.currentStock) < quantity) {
          throw new BadRequestException(
            `Insufficient stock. Current: ${product.currentStock}, Requested: ${quantity}`,
          );
        }
        newStock -= quantity;
        break;
      case StockMovementType.LOSS:
        movementType = 'LOSS';
        if (Number(product.currentStock) < quantity) {
          throw new BadRequestException(
            `Insufficient stock. Current: ${product.currentStock}, Requested: ${quantity}`,
          );
        }
        newStock -= quantity;
        break;
      case StockMovementType.PROFESSIONAL_USE:
        movementType = 'PROFESSIONAL_USE';
        if (Number(product.currentStock) < quantity) {
          throw new BadRequestException(
            `Insufficient stock. Current: ${product.currentStock}, Requested: ${quantity}`,
          );
        }
        newStock -= quantity;
        break;
      case StockMovementType.ADJUSTMENT:
        movementType = 'ADJUSTMENT';
        newStock = quantity;
        break;
    }

    let totalCost: number | undefined;

    if (unitCost) {
      totalCost = unitCost * quantity;
    } else if (movementType === 'LOSS') {
      totalCost = Number(product.costPrice) * quantity;
    } else if (
      movementType === 'PROFESSIONAL_USE' &&
      product.unitWeight &&
      product.markupPercent
    ) {
      const costPerUnit =
        Number(product.costPrice) / Number(product.unitWeight);
      const costWithMarkup =
        costPerUnit * (1 + Number(product.markupPercent) / 100);
      totalCost = costWithMarkup * quantity;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

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

      if (userId) {
        movementData.user = { connect: { id: userId } };
      }

      const movement = await tx.stockMovement.create({
        data: movementData,
      });

      await this.createFinancialTransactionForMovement(
        movement,
        updatedProduct,
        branchId,
        tx,
      );

      if (movement.type === 'OUT' && soldById && soldById.trim() !== '') {
        await this.createCommissionTransactionForSale(
          movement,
          updatedProduct,
          soldById,
          branchId,
          tx,
        );
      }

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
    if (!movement.totalCost || Number(movement.totalCost) <= 0) {
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
      case 'PROFESSIONAL_USE':
        transactionType = 'EXPENSE';
        categoryName = 'Uso Profissional';
        description = `Uso: ${product.name} (${movement.quantity} ${product.unit}) - ${movement.reason}`;
        break;
      default:
        return;
    }

    if (!transactionType) return;

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
        'Uso Profissional': '#8B5CF6',
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
  }

  private async createFinancialTransactionForProductCreation(
    product: Product,
    initialStock: number,
    costPrice: number,
    branchId: string,
    tx: any,
  ) {
    const totalCost = initialStock * costPrice;

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
  }

  async getStockMovements(
    branchId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StockMovement[]> {
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
      ? updateData.unitCost * Number(newQuantity)
      : movement.totalCost;

    return this.prisma.$transaction(async (tx) => {
      if (newProductId !== movement.productId) {
        let oldProductStock = Number(movement.product.currentStock);
        switch (movement.type) {
          case 'IN':
            oldProductStock -= Number(movement.quantity);
            break;
          case 'OUT':
          case 'LOSS':
            oldProductStock += Number(movement.quantity);
            break;
        }
        await tx.product.update({
          where: { id: movement.productId },
          data: { currentStock: oldProductStock },
        });

        const newProduct = await tx.product.findUnique({
          where: { id: newProductId },
        });
        if (!newProduct) {
          throw new NotFoundException('Novo produto não encontrado');
        }

        let newProductStock = Number(newProduct.currentStock);
        const newQuantityNum = Number(newQuantity);
        switch (newType) {
          case 'IN':
            newProductStock += newQuantityNum;
            break;
          case 'OUT':
          case 'LOSS':
            if (newProductStock < newQuantityNum) {
              throw new BadRequestException(
                'Estoque insuficiente no novo produto',
              );
            }
            newProductStock -= newQuantityNum;
            break;
          case 'ADJUSTMENT':
            newProductStock = newQuantityNum;
            break;
        }
        await tx.product.update({
          where: { id: newProductId },
          data: { currentStock: newProductStock },
        });
      } else {
        let currentStock = Number(movement.product.currentStock);
        const newQuantityNum = Number(newQuantity);

        switch (movement.type) {
          case 'IN':
            currentStock -= Number(movement.quantity);
            break;
          case 'OUT':
          case 'LOSS':
            currentStock += Number(movement.quantity);
            break;
        }

        switch (newType) {
          case 'IN':
            currentStock += newQuantityNum;
            break;
          case 'OUT':
          case 'LOSS':
            if (currentStock < newQuantityNum) {
              throw new BadRequestException('Estoque insuficiente');
            }
            currentStock -= newQuantityNum;
            break;
          case 'ADJUSTMENT':
            currentStock = newQuantityNum;
            break;
        }

        await tx.product.update({
          where: { id: movement.productId },
          data: { currentStock },
        });
      }

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

    let currentStock = Number(movement.product.currentStock);
    switch (movement.type) {
      case 'IN':
        currentStock -= Number(movement.quantity);
        break;
      case 'OUT':
      case 'LOSS':
        currentStock += Number(movement.quantity);
        break;
      case 'ADJUSTMENT':
        throw new BadRequestException(
          'Não é possível excluir movimentações de ajuste',
        );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: movement.productId },
        data: { currentStock },
      });

      await tx.stockMovement.delete({
        where: { id },
      });

      await tx.financialTransaction.deleteMany({
        where: { reference: `Estoque-${id}` },
      });
    });
  }

  async registerProfessionalMovement(
    id: string,
    movementDto: { quantity: number; reason?: string; reference?: string },
    branchId: string,
  ): Promise<{ product: Product; movement: StockMovement }> {
    const product = await this.findOne(id, branchId);

    console.log('Produto encontrado:', {
      id: product.id,
      name: product.name,
      productType: product.productType,
      currentStock: product.currentStock,
      unitWeight: product.unitWeight,
    });
    console.log('Movimento solicitado:', movementDto);

    if (product.productType !== 'PROFESSIONAL_USE') {
      throw new BadRequestException('Produto deve ser do tipo profissional');
    }

    const currentStockNum = Number(product.currentStock);
    if (currentStockNum < movementDto.quantity) {
      throw new BadRequestException(
        `Estoque insuficiente. Atual: ${currentStockNum}, Solicitado: ${movementDto.quantity}`,
      );
    }

    const newStock = currentStockNum - movementDto.quantity;

    let totalCost: number | null = null;
    let unitCost: number | null = null;

    if (product.unitWeight && product.markupPercent && product.costPrice) {
      const costPerUnit =
        Number(product.costPrice) / Number(product.unitWeight);
      const costWithMarkup =
        costPerUnit * (1 + Number(product.markupPercent) / 100);
      unitCost = costWithMarkup;
      totalCost = costWithMarkup * movementDto.quantity;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          product: { connect: { id } },
          branch: { connect: { id: branchId } },
          type: 'PROFESSIONAL_USE',
          quantity: movementDto.quantity,
          unitCost,
          totalCost,
          reason: movementDto.reason || 'Uso profissional',
          reference: movementDto.reference || `Uso-${id}-${Date.now()}`,
        },
      });

      if (totalCost && totalCost > 0) {
        await this.createFinancialTransactionForMovement(
          movement,
          updatedProduct,
          branchId,
          tx,
        );
      }

      return {
        product: updatedProduct,
        movement,
      };
    });
  }

  private async createCommissionTransactionForSale(
    movement: StockMovement,
    product: Product,
    professionalId: string,
    branchId: string,
    tx: any,
  ) {
    if (!movement.totalCost || Number(movement.totalCost) <= 0) {
      return;
    }

    const professional = await tx.professional.findUnique({
      where: { id: professionalId },
      include: {
        customRole: true,
      },
    });

    if (!professional) {
      return;
    }

    const commissionRate =
      professional.customRole?.commissionRate ||
      professional.commissionRate ||
      0;
    const commissionAmount =
      (Number(movement.totalCost) * Number(commissionRate)) / 100;

    if (commissionAmount <= 0) return;

    let commissionCategory = await tx.expenseCategory.findFirst({
      where: {
        branchId,
        name: 'Comissões',
        type: 'EXPENSE',
      },
    });

    if (!commissionCategory) {
      commissionCategory = await tx.expenseCategory.create({
        data: {
          name: 'Comissões',
          type: 'EXPENSE',
          color: '#8B5CF6',
          branchId,
        },
      });
    }

    await tx.financialTransaction.create({
      data: {
        description: `Comissão venda: ${professional.name} - ${product.name} (${movement.quantity} ${product.unit})`,
        amount: commissionAmount,
        type: 'EXPENSE',
        categoryId: commissionCategory.id,
        paymentMethod: 'OTHER',
        reference: `Venda-${movement.id}`,
        date: movement.createdAt,
        branchId,
      },
    });
  }
}
