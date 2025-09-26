import { Controller, Post, Body } from '@nestjs/common';
import { FidelityService } from './fidelity.service';
import {
  CreateCheckoutSessionForSubscriptionDto,
  CreateManagementSessionForSubscriptionDto,
} from './dto/fidelity.dto';

@Controller('fidelity')
export class FidelityController {
  constructor(private fidelityService: FidelityService) {}

  @Post('create-checkout-session')
  async createCheckoutSessionForSubscription(
    @Body() body: CreateCheckoutSessionForSubscriptionDto,
  ) {
    return await this.fidelityService.createCheckoutSessionForSubscription(
      body.clientId,
      body.email,
      body.accountId,
      body.priceId,
    );
  }

  @Post('create-management-session')
  async createManagementSessionForSubscription(
    @Body() body: CreateManagementSessionForSubscriptionDto,
  ) {
    return await this.fidelityService.createManagementSessionForSubscription(
      body.clientId,
      body.email,
      body.accountId,
    );
  }
}
