import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { Appointment } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuthenticatedRequest } from '@/common/middleware/auth.middleware';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly apptService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  create(
    @Body() body: CreateAppointmentDto & { status?: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<Appointment> {
    return this.apptService.create(
      {
        ...body,
        scheduledAt: new Date(body.scheduledAt),
        status: (body.status as any) || 'SCHEDULED',
      },
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  findAll(@Req() req: AuthenticatedRequest): Promise<Appointment[]> {
    return this.apptService.findAll({
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Get('available-slots/:professionalId/:date')
  @ApiOperation({ summary: 'Buscar horários disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de horários disponíveis' })
  getAvailableSlots(
    @Param('professionalId') professionalId: string,
    @Param('date') date: string,
  ): Promise<string[]> {
    // Validar parâmetros antes de chamar o service
    if (!professionalId || professionalId === 'undefined' || !date || date === 'undefined') {
      return Promise.resolve([]);
    }
    return this.apptService.getAvailableSlots(professionalId, date);
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
    return this.apptService.cancelAppointment(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirmar agendamento como realizado' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento confirmado com sucesso',
  })
  confirmAppointment(@Param('id') id: string): Promise<Appointment> {
    return this.apptService.confirmAppointment(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento cancelado com sucesso',
  })
  cancelAppointment(@Param('id') id: string): Promise<void> {
    return this.apptService.cancelAppointment(id);
  }
}
