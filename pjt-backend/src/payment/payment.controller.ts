import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  CreateCustomerDto,
  CreateCheckoutSessionDto,
  CreateAccountSessionDto,
} from './dto/payment.dto';

@Controller('payment')
export class ResetPasswordController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-customer')
  async createCustomer(@Body() body: CreateCustomerDto) {
    return await this.paymentService.createCustomer(body);
  }

  @Post('account')
  async createAccount(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return await this.paymentService.createAccount(token);
  }

  @Post('account_session')
  async createAccountSession(@Body() body: CreateAccountSessionDto) {
    return await this.paymentService.createAccountSession(body);
  }

  @Post('create-checkout-session')
  async createCheckoutSession(@Body() body: CreateCheckoutSessionDto) {
    return await this.paymentService.createCheckoutSession(body);
  }

  @Get('retrieve-products')
  async retrieveAllProducts() {
    return await this.paymentService.retrieveAllProducts();
  }

  @Get('user-has-active-subscription')
  userHasActiveSubscription(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.paymentService.userHasActiveSubscription(token);
  }

  @Get('get-user-subscriptions')
  getUserSubscriptions(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.paymentService.getUserSubscriptions(token);
  }

  @Post('create-portal-session')
  createPortalSession(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.paymentService.createPortalSession(token);
  }
}
