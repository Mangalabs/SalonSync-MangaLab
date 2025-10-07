import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Nome do serviço' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do serviço' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Preço do serviço' })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Preço deve ser maior que zero' })
  @Max(99999999.99, { message: 'Preço não pode exceder R$ 99.999.999,99' })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  price?: number;

  @ApiPropertyOptional({ description: 'Duração em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Duração deve ser maior que zero' })
  @Max(1440, { message: 'Duração não pode exceder 24 horas (1440 minutos)' })
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  durationMin?: number;
}
