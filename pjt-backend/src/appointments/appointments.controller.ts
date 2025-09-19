import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Req,
  Query,
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
    const targetBranchId = req.headers['x-branch-id'] as string;
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
      targetBranchId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('professionalId') professionalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Appointment[]> {
    return this.apptService.findAll(
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
      { professionalId, startDate, endDate },
    );
  }

  @Get('available-slots/:professionalId/:date')
  @ApiOperation({ summary: 'Buscar horários disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de horários disponíveis' })
  async getAvailableSlots(
    @Param('professionalId') professionalId: string,
    @Param('date') date: string,
  ): Promise<string[]> {
    if (
      !professionalId ||
      professionalId === 'undefined' ||
      !date ||
      date === 'undefined'
    ) {
      return [];
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

  @Post('fix-historical')
  @ApiOperation({ summary: 'Corrigir atendimentos históricos' })
  @ApiResponse({
    status: 200,
    description: 'Atendimentos históricos corrigidos com sucesso',
  })
  async fixHistoricalAppointments(): Promise<{ fixed: number; message: string }> {
    return this.apptService.fixHistoricalAppointments();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento atualizado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  update(
    @Param('id') id: string,
    @Body() body: CreateAppointmentDto & { status?: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<Appointment> {
    const targetBranchId = req.headers['x-branch-id'] as string;
    return this.apptService.update(
      id,
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
      targetBranchId,
    );
  }
}
