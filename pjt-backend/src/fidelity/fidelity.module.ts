import { Module } from '@nestjs/common';
import { FidelityController } from './fidelity.controller';
import { FidelityService } from './fidelity.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FidelityController],
  providers: [FidelityService],
  exports: [FidelityService],
})
export class FidelityModule {}
