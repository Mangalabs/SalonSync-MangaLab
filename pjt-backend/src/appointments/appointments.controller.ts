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
import { QueueService } from './queue.service';
import { Appointment } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AddServicesDto } from './dto/add-services.dto';
import { AddProductsDto } from './dto/add-products.dto';
import { CheckoutAppointmentDto } from './dto/checkout-appointment.dto';
import { AuthenticatedRequest } from '@/common/middleware/auth.middleware';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly apptService: AppointmentsService,
    private readonly queueService: QueueService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  create(
    @Body() body: CreateAppointmentDto & { status?: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<Appointment> {
    const targetBranchId = req.headers['x-branch-id'] as string;

    // Tratar scheduledAt como horário de São Paulo
    // Se vier como "2026-01-14 15:30:00", adicionar indicador de timezone
    const scheduledAtStr = body.scheduledAt.includes('T')
      ? body.scheduledAt
      : body.scheduledAt.replace(' ', 'T') + '-03:00';

    return this.apptService.create(
      {
        ...body,
        scheduledAt: new Date(scheduledAtStr),
        status: (body.status as any) || 'PENDING',
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

  @Get('queue-stats')
  @ApiOperation({ summary: 'Obter estatísticas da fila de atendimento' })
  @ApiResponse({ status: 200, description: 'Estatísticas da fila' })
  getQueueStats(@Query('date') date: string, @Req() req: AuthenticatedRequest) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const branchId = req.user.branchId || '';
    return this.queueService.getQueueStats(branchId, targetDate);
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
  confirmAppointment(
    @Param('id') id: string,
    @Body() body?: { scheduledAt?: string },
  ): Promise<Appointment> {
    const newScheduledAt = body?.scheduledAt
      ? new Date(body.scheduledAt)
      : undefined;
    return this.apptService.confirmAppointment(id, newScheduledAt);
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

  @Post('remove-duplicates')
  @ApiOperation({ summary: 'Remover transações duplicadas' })
  @ApiResponse({
    status: 200,
    description: 'Transações duplicadas removidas com sucesso',
  })
  async removeDuplicateTransactions(): Promise<{
    removed: number;
    message: string;
  }> {
    return this.apptService.removeDuplicateTransactions();
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

    // Tratar scheduledAt como horário de São Paulo
    const scheduledAtStr = body.scheduledAt.includes('T')
      ? body.scheduledAt
      : body.scheduledAt.replace(' ', 'T') + '-03:00';

    return this.apptService.update(
      id,
      {
        ...body,
        scheduledAt: new Date(scheduledAtStr),
        status: (body.status as any) || 'PENDING',
      },
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
      targetBranchId,
    );
  }

  // ==================== ENDPOINTS DE GERENCIAMENTO DE COMANDA ====================

  @Post(':id/start')
  @ApiOperation({ summary: 'Iniciar atendimento (PENDING → IN_PROGRESS)' })
  @ApiResponse({
    status: 200,
    description: 'Atendimento iniciado com sucesso',
  })
  startAppointment(@Param('id') id: string): Promise<Appointment> {
    return this.apptService.startAppointment(id);
  }

  @Patch(':id/services')
  @ApiOperation({ summary: 'Adicionar ou remover serviços da comanda' })
  @ApiResponse({
    status: 200,
    description: 'Serviços atualizados com sucesso',
  })
  manageServices(
    @Param('id') id: string,
    @Body() body: AddServicesDto & { action: 'add' | 'remove' },
  ): Promise<Appointment> {
    if (body.action === 'remove') {
      return this.apptService.removeServices(id, body.serviceIds);
    }
    return this.apptService.addServices(id, body.serviceIds);
  }

  @Patch(':id/products')
  @ApiOperation({ summary: 'Adicionar ou remover produtos da comanda' })
  @ApiResponse({
    status: 200,
    description: 'Produtos atualizados com sucesso',
  })
  manageProducts(
    @Param('id') id: string,
    @Body() body: AddProductsDto & { action: 'add' | 'remove' },
  ): Promise<Appointment> {
    if (body.action === 'remove') {
      const productIds = body.products.map((p) => p.productId);
      return this.apptService.removeProducts(id, productIds);
    }
    return this.apptService.addProducts(id, body.products);
  }

  @Post(':id/checkout')
  @ApiOperation({ summary: 'Finalizar comanda (checkout)' })
  @ApiResponse({
    status: 200,
    description: 'Checkout realizado com sucesso',
  })
  checkout(
    @Param('id') id: string,
    @Body() body: CheckoutAppointmentDto,
  ): Promise<Appointment> {
    return this.apptService.checkoutAppointment(
      id,
      body.paymentMethod,
      body.notes,
    );
  }
}
