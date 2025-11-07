-- AlterEnum
-- First, update existing SCHEDULED appointments to CONFIRMED to preserve data
UPDATE "Appointment" SET status = 'CONFIRMED' WHERE status = 'SCHEDULED';

-- Add new enum values
ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING';
ALTER TYPE "AppointmentStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "AppointmentStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'PENDING';