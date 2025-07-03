import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { Request } from 'express';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Obter dados do dashboard' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard' })
  getDashboard(@Req() request: Request) {
    const user = request['user'];
    return {
      message: 'Bem-vindo ao dashboard!',
      userId: user.sub,
    };
  }

  @Get('today-appointments')
  @ApiOperation({ summary: 'Obter atendimentos do dia' })
  @ApiResponse({ status: 200, description: 'Lista de atendimentos do dia' })
  getTodayAppointments() {
    return this.dashboardService.getTodayAppointments();
  }
}
