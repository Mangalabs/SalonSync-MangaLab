import { IsNotEmpty, IsString, IsNumber, IsEnum, Min, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  LOSS = 'LOSS',
}

export class AdjustStockDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  quantity: number;

  @IsNotEmpty()
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  unitCost?: number;
}