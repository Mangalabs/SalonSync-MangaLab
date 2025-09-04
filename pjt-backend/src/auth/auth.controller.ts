import { Controller, Post, Body, Get, Headers, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('profile')
  getProfile(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.getProfile(token);
  }

  @Patch('profile')
  updateProfile(
    @Headers('authorization') auth: string,
    @Body()
    body: {
      name?: string;
      businessName?: string;
      phone?: string;
    },
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.updateProfile(token, body);
  }

  @Post('create-employee')
  createEmployee(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      role: string;
      roleId?: string;
      commissionRate?: number;
      branchId: string;
    },
  ) {
    return this.authService.createEmployee(body);
  }

  @Post('create-admin')
  createAdmin(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      businessName: string;
      branchName?: string;
      city: string;
      country: string;
      line1: string;
      postal_code: string;
      state: string;
    },
  ) {
    return this.authService.createAdmin(body);
  }
}
