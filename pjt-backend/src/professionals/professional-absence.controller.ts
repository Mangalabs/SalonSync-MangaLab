import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { AuthenticatedRequest } from '@/common/middleware/auth.middleware';
import { ProfessionalAbsenceService } from './professional-absence.service';

@Controller('professional-absences')
export class ProfessionalAbsenceController {
  constructor(private absenceService: ProfessionalAbsenceService) {}

  @Post()
  async create(
    @Body()
    data: {
      professionalId: string;
      startDate: string;
      endDate: string;
      reason?: string;
      type: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'TRAINING' | 'OTHER';
      isRecurring?: boolean;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.absenceService.create(
      {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
    );
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.absenceService.findAll(
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
      professionalId,
    );
  }

  @Get('test')
  async test() {
    return { message: 'Test endpoint working', timestamp: new Date() };
  }

  @Get('upcoming')
  async getUpcoming(@Req() req: AuthenticatedRequest) {
    return this.absenceService.getUpcomingAbsences({
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      startDate?: string;
      endDate?: string;
      reason?: string;
      type?: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'TRAINING' | 'OTHER';
      isRecurring?: boolean;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return this.absenceService.update(id, updateData, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.absenceService.delete(id, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
    return { message: 'Ausência removida com sucesso' };
  }
}
