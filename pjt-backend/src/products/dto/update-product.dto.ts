import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99999999.99, { message: 'Preço de custo não pode exceder R$ 99.999.999,99' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99999999.99, { message: 'Preço de venda não pode exceder R$ 99.999.999,99' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999, { message: 'Estoque atual não pode exceder 999.999.999 unidades' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999, { message: 'Estoque mínimo não pode exceder 999.999.999 unidades' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  minStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999, { message: 'Estoque máximo não pode exceder 999.999.999 unidades' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  maxStock?: number;
}
