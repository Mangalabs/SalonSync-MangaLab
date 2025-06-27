import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Nome do serviço' })
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do serviço' })
  description?: string;

  @ApiPropertyOptional({ description: 'Preço do serviço' })
  price?: number;

  @ApiPropertyOptional({ description: 'Duração em minutos' })
  durationMin?: number;
}