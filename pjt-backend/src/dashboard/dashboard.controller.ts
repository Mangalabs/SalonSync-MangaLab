import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('dashboard')
export class DashboardController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getDashboard(@Req() request: Request) {
    const user = request['user'];
    return {
      message: 'Bem-vindo ao dashboard!',
      userId: user.sub,
    };
  }
}
