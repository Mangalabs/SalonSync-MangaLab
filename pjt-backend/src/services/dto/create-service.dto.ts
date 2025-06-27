import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ description: 'Nome do serviço' })
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do serviço' })
  description?: string;

  @ApiProperty({ description: 'Preço do serviço' })
  price: number;

  @ApiProperty({ description: 'Duração em minutos' })
  durationMin: number;
}