import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { ScheduleBlocksService } from './schedule-blocks.service';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';

@Controller('schedule-blocks')
@UseGuards(JwtAuthGuard)
export class ScheduleBlocksController {
  constructor(private readonly scheduleBlocksService: ScheduleBlocksService) {}

  @Post()
  create(@Body() dto: CreateScheduleBlockDto) {
    return this.scheduleBlocksService.create(dto);
  }

  @Get('professional/:professionalId')
  findByProfessional(
    @Param('professionalId') professionalId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleBlocksService.findByProfessional(
      professionalId,
      startDate,
      endDate,
    );
  }

  @Get('professional/:professionalId/date/:date')
  findByDate(
    @Param('professionalId') professionalId: string,
    @Param('date') date: string,
  ) {
    return this.scheduleBlocksService.findByDate(professionalId, date);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.scheduleBlocksService.delete(id);
  }

  @Delete('batch')
  deleteMany(@Body('ids') ids: string[]) {
    return this.scheduleBlocksService.deleteMany(ids);
  }
}
