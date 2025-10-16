import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { QueueService } from './queue.service';
import { AppointmentsController } from './appointments.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AppointmentsService, QueueService],
  controllers: [AppointmentsController],
  exports: [AppointmentsService, QueueService],
})
export class AppointmentsModule {}
