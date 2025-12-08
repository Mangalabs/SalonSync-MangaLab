import { Module } from '@nestjs/common';
import { BranchHoursController } from './branch-hours.controller';
import { BranchHoursService } from './branch-hours.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BranchHoursController],
  providers: [BranchHoursService, PrismaService],
  exports: [BranchHoursService],
})
export class BranchHoursModule {}