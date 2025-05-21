import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from '@prisma/client';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly apptService: AppointmentsService) {}

  @Post()
  create(
    @Body()
    body: {
      professionalId: string;
      clientId: string;
      serviceIds: string[];
    },
  ): Promise<Appointment> {
    return this.apptService.create(body);
  }

  @Get()
  findAll(): Promise<Appointment[]> {
    return this.apptService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Appointment> {
    return this.apptService.findOne(id);
  }
}
