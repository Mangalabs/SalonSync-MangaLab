UPDATE "Appointment" SET status = 'CONFIRMED' WHERE status = 'SCHEDULED';

ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
