/*
  Warnings:

  - You are about to alter the column `currentStock` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,3)`.
  - You are about to alter the column `quantity` on the `StockMovement` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,3)`.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SALE', 'PROFESSIONAL_USE');

-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'PROFESSIONAL_USE';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "markupPercent" DECIMAL(5,2),
ADD COLUMN     "productType" "ProductType" NOT NULL DEFAULT 'SALE',
ADD COLUMN     "unitWeight" DECIMAL(10,3),
ALTER COLUMN "currentStock" SET DEFAULT 0,
ALTER COLUMN "currentStock" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "StockMovement" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);
