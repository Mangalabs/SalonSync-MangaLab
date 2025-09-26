import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  line1: string;

  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @IsString()
  @IsNotEmpty()
  state: string;
}

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  priceId: string;
}

export class CreatePriceForConnectedAccountDto {
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsString()
  @IsNotEmpty()
  planName: string;
}

export class UpdatePriceForConnectedAccountDto {
  @IsNumber()
  value: number;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  planName: string;

  @IsString()
  @IsNotEmpty()
  priceId: string;
}

export class PriceReadjustmentForConnectedAccountDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;
}

export class CreateAccountSessionDto {
  @IsString()
  @IsNotEmpty()
  account: string;
}
