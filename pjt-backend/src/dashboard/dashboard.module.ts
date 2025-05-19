import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
