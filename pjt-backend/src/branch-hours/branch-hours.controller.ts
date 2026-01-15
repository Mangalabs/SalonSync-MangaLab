import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { BranchHoursService } from './branch-hours.service';
import { CreateBranchHoursDto } from './dto/create-branch-hours.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('branch-hours')
@UseGuards(JwtAuthGuard)
export class BranchHoursController {
  constructor(private readonly branchHoursService: BranchHoursService) {}

  // Rotas mais específicas primeiro (antes de :branchId genérico)
  @Get(':branchId/time-slots/:dayOfWeek')
  async getTimeSlots(
    @Param('branchId') branchId: string,
    @Param('dayOfWeek') dayOfWeek: string,
  ) {
    return this.branchHoursService.getTimeSlots(branchId, parseInt(dayOfWeek));
  }

  @Get(':branchId/is-open/:dayOfWeek/:time')
  async isOpen(
    @Param('branchId') branchId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Param('time') time: string,
  ) {
    const isOpen = await this.branchHoursService.isOpen(
      branchId,
      parseInt(dayOfWeek),
      time,
    );
    return { isOpen };
  }

  @Put(':branchId/bulk')
  async updateMultipleHours(
    @Param('branchId') branchId: string,
    @Body() hoursData: CreateBranchHoursDto[],
  ) {
    return this.branchHoursService.updateMultiple(branchId, hoursData);
  }

  @Get(':branchId')
  async getBranchHours(@Param('branchId') branchId: string) {
    return this.branchHoursService.findByBranch(branchId);
  }

  @Post(':branchId')
  async createOrUpdateHours(
    @Param('branchId') branchId: string,
    @Body() dto: CreateBranchHoursDto,
  ) {
    return this.branchHoursService.createOrUpdate(branchId, dto);
  }

  @Delete(':branchId/:dayOfWeek')
  async deleteHours(
    @Param('branchId') branchId: string,
    @Param('dayOfWeek') dayOfWeek: string,
  ) {
    return this.branchHoursService.delete(branchId, parseInt(dayOfWeek));
  }
}
