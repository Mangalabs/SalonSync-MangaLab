/*
  Warnings:

  - Added the required column `ownerId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/

-- Primeiro, adicionar a coluna como opcional
ALTER TABLE "Service" ADD COLUMN "ownerId" TEXT;

-- Atualizar serviços existentes com o primeiro usuário admin encontrado
UPDATE "Service" SET "ownerId" = (
  SELECT "id" FROM "User" WHERE "role" = 'ADMIN' LIMIT 1
) WHERE "ownerId" IS NULL;

-- Tornar a coluna obrigatória
ALTER TABLE "Service" ALTER COLUMN "ownerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
