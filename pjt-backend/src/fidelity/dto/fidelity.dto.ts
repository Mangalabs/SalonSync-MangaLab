import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCheckoutSessionForSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  priceId: string;
}

export class CreateManagementSessionForSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  accountId: string;
}
