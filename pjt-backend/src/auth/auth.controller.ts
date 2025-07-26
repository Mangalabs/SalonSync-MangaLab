import { Controller, Post, Body, Get, Headers, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SuperAdminGuard } from './super-admin.guard';

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
    @Body() body: {
      name?: string;
      businessName?: string;
      phone?: string;
    }
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.updateProfile(token, body);
  }

  @Post('create-employee')
  createEmployee(@Body() body: {
    email: string;
    password: string;
    name: string;
    role: string;
    branchId: string;
  }) {
    return this.authService.createEmployee(body);
  }

  @Post('create-admin')
  @UseGuards(SuperAdminGuard)
  createAdmin(@Body() body: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    branchName?: string;
  }) {
    return this.authService.createAdmin(body);
  }
}
