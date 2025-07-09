import { Controller, Post, Body, Get, Headers, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  register(@Body() body: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    branches: { name: string }[];
  }) {
    return this.authService.register(body);
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
}
