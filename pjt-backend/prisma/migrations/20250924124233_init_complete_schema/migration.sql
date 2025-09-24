-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('VACATION', 'SICK_LEAVE', 'PERSONAL', 'TRAINING', 'OTHER');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('PENDING', 'CONNECTING', 'CONNECTED', 'ERROR', 'SUSPENDED', 'DISCONNECTED');

-- AlterTable
ALTER TABLE "WhatsAppConfig" ADD COLUMN "accessToken" TEXT,
ADD COLUMN     "aiEnabled" BOOLEAN DEFAULT false,
ADD COLUMN     "aiPersonality" TEXT,
ADD COLUMN     "autoResponses" JSONB,
ADD COLUMN     "businessHours" JSONB,
ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "errorCount" INTEGER DEFAULT 0,
ADD COLUMN     "lastSync" TIMESTAMP(3),
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "phoneNumberId" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "status" "WhatsAppStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifyToken" TEXT,
ADD COLUMN     "wabaId" TEXT;

ALTER TABLE "WhatsAppConfig" 
DROP COLUMN "accountSid",
DROP COLUMN "authTokenEncrypted",
DROP COLUMN "whatsappNumber";


-- CreateTable
CREATE TABLE "BranchSettings" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "defaultStartTime" TEXT NOT NULL DEFAULT '09:00',
    "defaultEndTime" TEXT NOT NULL DEFAULT '18:00',
    "lunchStartTime" TEXT NOT NULL DEFAULT '12:00',
    "lunchEndTime" TEXT NOT NULL DEFAULT '14:00',
    "appointmentDuration" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "whatsappConfigId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageId" TEXT,
    "status" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalAbsence" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "type" "AbsenceType" NOT NULL DEFAULT 'VACATION',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalWorkingDay" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalWorkingDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BranchSettings_branchId_key" ON "BranchSettings"("branchId");

-- CreateIndex
CREATE INDEX "ChatMessage_whatsappConfigId_phone_idx" ON "ChatMessage"("whatsappConfigId", "phone");

-- CreateIndex
CREATE INDEX "ChatMessage_timestamp_idx" ON "ChatMessage"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalWorkingDay_professionalId_dayOfWeek_key" ON "ProfessionalWorkingDay"("professionalId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConfig_branchId_key" ON "WhatsAppConfig"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConfig_phoneNumber_key" ON "WhatsAppConfig"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConfig_phoneNumberId_key" ON "WhatsAppConfig"("phoneNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConfig_verifyToken_key" ON "WhatsAppConfig"("verifyToken");

-- CreateIndex
CREATE INDEX "WhatsAppConfig_phoneNumber_idx" ON "WhatsAppConfig"("phoneNumber");

-- CreateIndex
CREATE INDEX "WhatsAppConfig_status_idx" ON "WhatsAppConfig"("status");

-- CreateIndex
CREATE INDEX "WhatsAppConfig_verifyToken_idx" ON "WhatsAppConfig"("verifyToken");

-- AddForeignKey
ALTER TABLE "BranchSettings" ADD CONSTRAINT "BranchSettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_whatsappConfigId_fkey" FOREIGN KEY ("whatsappConfigId") REFERENCES "WhatsAppConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAbsence" ADD CONSTRAINT "ProfessionalAbsence_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalWorkingDay" ADD CONSTRAINT "ProfessionalWorkingDay_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
