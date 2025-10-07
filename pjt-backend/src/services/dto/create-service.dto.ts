import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ description: 'Nome do serviço' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do serviço' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Preço do serviço' })
  @IsNumber()
  @Min(0.01, { message: 'Preço deve ser maior que zero' })
  @Max(99999999.99, { message: 'Preço não pode exceder R$ 99.999.999,99' })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  price: number;

  @ApiProperty({ description: 'Duração em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Duração deve ser maior que zero' })
  @Max(1440, { message: 'Duração não pode exceder 24 horas (1440 minutos)' })
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  durationMin?: number;
}
