import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { BranchHoursModule } from './branch-hours/branch-hours.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { FinancialModule } from './financial/financial.module';
import { RolesModule } from './roles/roles.module';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { BaseDataService } from './common/services/base-data.service';
import { ValidationErrorInterceptor } from './common/interceptors/validation-error.interceptor';
import { AiModule } from './ai/ai.module';
import { ResetPasswordModule } from './resetPassword/resetPassword.module';
import { PaymentModule } from './payment/paument.module';
import { FidelityModule } from './fidelity/fidelity.module';
import { PublicModule } from './public/public.module';
import { ScheduleBlocksModule } from './schedule-blocks/schedule-blocks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BranchesModule,
    BranchHoursModule,
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
    ResetPasswordModule,
    PaymentModule,
    FidelityModule,
    PublicModule,
    ScheduleBlocksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BaseDataService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ValidationErrorInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/create-admin', method: RequestMethod.POST },
        { path: 'reset/generate', method: RequestMethod.POST },
        { path: 'reset/reset', method: RequestMethod.POST },
        { path: 'payment/create-checkout-session', method: RequestMethod.POST },
        { path: 'payment/create-customer', method: RequestMethod.POST },
        { path: 'payment/retrieve-products', method: RequestMethod.GET },
        { path: 'test', method: RequestMethod.GET },
        { path: 'public/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
