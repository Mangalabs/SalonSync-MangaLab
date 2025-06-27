import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'Nome do cliente' })
  name: string;

  @ApiPropertyOptional({ description: 'Telefone do cliente' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Email do cliente' })
  email?: string;
}