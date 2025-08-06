import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWhatsAppConfigDto {
  @IsString()
  @IsNotEmpty()
  accountSid: string;

  @IsString()
  @IsNotEmpty()
  authToken: string;

  @IsString()
  @IsNotEmpty()
  whatsappNumber: string;
}
