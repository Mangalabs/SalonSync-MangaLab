import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
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
  @Max(999999999, { message: 'Quantidade não pode exceder 999.999.999 unidades' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
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
  @Max(99999999.99, { message: 'Valor unitário não pode exceder R$ 99.999.999,99' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  unitCost?: number;

  @IsOptional()
  @IsString()
  soldById?: string;
}
