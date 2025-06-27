import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { Appointment } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly apptService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  create(@Body() body: CreateAppointmentDto): Promise<Appointment> {
    return this.apptService.create({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  findAll(): Promise<Appointment[]> {
    return this.apptService.findAll();
  }

  @Get('available-slots/:professionalId/:date')
  @ApiOperation({ summary: 'Buscar horários disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de horários disponíveis' })
  getAvailableSlots(
    @Param('professionalId') professionalId: string,
    @Param('date') date: string,
  ): Promise<string[]> {
    return this.apptService.getAvailableSlots(professionalId, date);
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Buscar agendamentos por data' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos da data' })
  getAppointmentsByDate(@Param('date') date: string): Promise<Appointment[]> {
    return this.apptService.getAppointmentsByDate(date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  findOne(@Param('id') id: string): Promise<Appointment> {
    return this.apptService.findOne(id);
  }
}
