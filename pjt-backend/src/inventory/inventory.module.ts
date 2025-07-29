import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { ProductsModule } from '../products/products.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [InventoryController],
})
export class InventoryModule {}
