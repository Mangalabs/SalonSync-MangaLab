-- DropForeignKey
ALTER TABLE "public"."FinancialTransaction" DROP CONSTRAINT "FinancialTransaction_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecurringExpense" DROP CONSTRAINT "RecurringExpense_professionalId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" ALTER COLUMN "professionalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."FinancialTransaction" ALTER COLUMN "appointmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."RecurringExpense" ALTER COLUMN "professionalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Role" ADD COLUMN     "baseSalary" DECIMAL(10,2),
ADD COLUMN     "salaryPayDay" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringExpense" ADD CONSTRAINT "RecurringExpense_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
