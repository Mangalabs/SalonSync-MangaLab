-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "phone" TEXT;
