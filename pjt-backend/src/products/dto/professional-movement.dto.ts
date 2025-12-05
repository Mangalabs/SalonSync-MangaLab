import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProfessionalMovementDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Type(() => Number)
  unitCost?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  totalCost?: number;
}