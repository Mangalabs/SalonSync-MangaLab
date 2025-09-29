import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalAbsenceController } from './professional-absence.controller';
import { ProfessionalAbsenceService } from './professional-absence.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessionalsController, ProfessionalAbsenceController],
  providers: [ProfessionalsService, ProfessionalAbsenceService],
  exports: [ProfessionalsService, ProfessionalAbsenceService],
})
export class ProfessionalsModule {}
