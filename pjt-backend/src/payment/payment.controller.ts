import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  Delete,
  Param,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  CreateCustomerDto,
  CreateCheckoutSessionDto,
  CreateAccountSessionDto,
  CreatePriceForConnectedAccountDto,
  UpdatePriceForConnectedAccountDto,
  PriceReadjustmentForConnectedAccountDto,
} from './dto/payment.dto';

@Controller('payment')
export class PaymentController {
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

  @Post('create-prices-for-connected-account')
  createPriceForConnectedAccount(
    @Headers('authorization') auth: string,
    @Body() body: CreatePriceForConnectedAccountDto,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.paymentService.createPriceForConnectedAccount(
      token,
      body.value,
      body.planName,
    );
  }

  @Get('get-prices-for-connected-account')
  retrievePricesForConnectedAccount(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.paymentService.retrievePricesForConnectedAccount(token);
  }

  @Post('update-prices-for-connected-account')
  updatePriceForConnectedAccount(
    @Headers('authorization') auth: string,
    @Body() body: UpdatePriceForConnectedAccountDto,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.paymentService.updatePriceForConnectedAccount(
      token,
      body.value,
      body.planName,
      body.planId,
      body.priceId,
    );
  }

  @Delete('archive-prices-for-connected-account/:priceId')
  archivePriceForConnectedAccount(
    @Headers('authorization') auth: string,
    @Param('priceId') priceId: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.paymentService.archivePriceForConnectedAccount(token, priceId);
  }

  @Post('price-readjustment-for-connected-account')
  priceReadjustmentForConnectedAccount(
    @Headers('authorization') auth: string,
    @Body() body: PriceReadjustmentForConnectedAccountDto,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.paymentService.priceReadjustmentForConnectedAccount(
      token,
      body.priceId,
      body.value,
      body.productId,
    );
  }
}
