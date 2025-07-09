import { Body, Controller, Get, Param, Post, Delete, Headers } from '@nestjs/common';
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
  create(
    @Body() body: CreateAppointmentDto & { status?: string },
    @Headers('authorization') auth?: string,
    @Headers('x-branch-id') branchId?: string
  ): Promise<Appointment> {
    const token = auth?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { sub: string };
        userId = decoded.sub;
      } catch (error) {}
    }
    
    return this.apptService.create({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
      status: (body.status as any) || 'SCHEDULED',
      userId,
      branchId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  findAll(
    @Headers('authorization') auth?: string,
    @Headers('x-branch-id') branchId?: string
  ): Promise<Appointment[]> {
    const token = auth?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { sub: string };
        userId = decoded.sub;
      } catch (error) {}
    }
    
    return this.apptService.findAll(userId, branchId);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Remover agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.apptService.remove(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirmar agendamento como realizado' })
  @ApiResponse({ status: 200, description: 'Agendamento confirmado com sucesso' })
  confirmAppointment(@Param('id') id: string): Promise<Appointment> {
    return this.apptService.confirmAppointment(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado com sucesso' })
  cancelAppointment(@Param('id') id: string): Promise<void> {
    return this.apptService.cancelAppointment(id);
  }
}
