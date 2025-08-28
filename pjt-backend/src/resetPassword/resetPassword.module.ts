import { Module } from '@nestjs/common';
import { ResetPasswordController } from './resetPassword.controller';
import { ResetPasswordService } from './resetPassword.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResetPasswordController],
  providers: [ResetPasswordService],
  exports: [ResetPasswordService],
})
export class ResetPasswordModule {}
