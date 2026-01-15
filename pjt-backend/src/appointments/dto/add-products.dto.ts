import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductItem {
  @ApiProperty({
    description: 'ID do produto',
    example: 'product-id-1',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto',
    example: 2.5,
  })
  @IsNumber()
  quantity: number;
}

export class AddProductsDto {
  @ApiProperty({
    description: 'Lista de produtos a serem adicionados',
    type: [ProductItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItem)
  products: ProductItem[];
}
