import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ClientsModule } from '../clients/clients.module';
import { ServicesModule } from '../services/services.module';
import { ProfessionalsModule } from '../professionals/professionals.module';

@Module({
  imports: [
    PrismaModule,
    AppointmentsModule,
    ClientsModule,
    ServicesModule,
    ProfessionalsModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
