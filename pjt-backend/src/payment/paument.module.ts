import { Module } from '@nestjs/common';
import { ResetPasswordController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResetPasswordController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
