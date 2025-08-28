import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { ServicesModule } from './services/services.module';
import { ClientsModule } from './clients/clients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { BranchesModule } from './branches/branches.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { FinancialModule } from './financial/financial.module';
import { RolesModule } from './roles/roles.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { BaseDataService } from './common/services/base-data.service';
import { AiModule } from './ai/ai.module';
import { ResetPasswordModule } from './resetPassword/resetPassword.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BranchesModule,
    RolesModule,
    ProfessionalsModule,
    DashboardModule,
    ServicesModule,
    ClientsModule,
    AppointmentsModule,
    ProductsModule,
    InventoryModule,
    FinancialModule,
    AiModule,
    WhatsAppModule,
    ResetPasswordModule,
  ],
  controllers: [AppController],
  providers: [AppService, BaseDataService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'whatsapp/webhook', method: RequestMethod.POST },
        { path: 'reset/generate', method: RequestMethod.POST },
        { path: 'reset/reset', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
