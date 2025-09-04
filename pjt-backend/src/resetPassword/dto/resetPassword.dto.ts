import { IsString, IsNotEmpty } from 'class-validator';

export class SendResetPasswordLinkDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordLinkDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
