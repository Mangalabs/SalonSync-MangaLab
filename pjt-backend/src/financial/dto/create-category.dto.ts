import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from './create-transaction.dto';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
