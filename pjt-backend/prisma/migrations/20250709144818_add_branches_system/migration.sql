-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create default branch for existing user
INSERT INTO "Branch" ("id", "name", "ownerId") 
SELECT gen_random_uuid(), 'Filial Principal', "id" 
FROM "User" 
LIMIT 1;

-- Add branchId columns with default value
ALTER TABLE "Professional" ADD COLUMN "branchId" TEXT;
ALTER TABLE "Service" ADD COLUMN "branchId" TEXT;
ALTER TABLE "Client" ADD COLUMN "branchId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "branchId" TEXT;

-- Update existing records with default branch
UPDATE "Professional" SET "branchId" = (SELECT "id" FROM "Branch" LIMIT 1);
UPDATE "Service" SET "branchId" = (SELECT "id" FROM "Branch" LIMIT 1);
UPDATE "Client" SET "branchId" = (SELECT "id" FROM "Branch" LIMIT 1);
UPDATE "Appointment" SET "branchId" = (SELECT "id" FROM "Branch" LIMIT 1);

-- Make columns NOT NULL after setting values
ALTER TABLE "Professional" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "branchId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;