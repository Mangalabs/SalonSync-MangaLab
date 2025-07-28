-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_branchId_fkey";

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "branchId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
