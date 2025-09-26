/*
  Warnings:

  - A unique constraint covering the columns `[customerId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "customerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_customerId_key" ON "Client"("customerId");
