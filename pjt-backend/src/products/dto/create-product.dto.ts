import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  unit: string = 'un';

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
  @Max(999999999, { message: 'Quantidade não pode exceder 999.999.999 unidades' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  initialStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999, { message: 'Estoque mínimo não pode exceder 999.999.999 unidades' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  minStock?: number;

  @IsOptional()
  @IsString()
  productType?: 'SALE' | 'PROFESSIONAL_USE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.999, { message: 'Peso unitário não pode exceder 999.999,999' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  unitWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999.99, { message: 'Markup não pode exceder 999,99%' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  markupPercent?: number;
}
