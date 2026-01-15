import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  PIX = 'PIX',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

export class CheckoutAppointmentDto {
  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: 'CASH',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Observações sobre o atendimento',
    example: 'Cliente solicitou desconto de 10%',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
