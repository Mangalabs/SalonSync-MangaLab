import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateRecurringExpenseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAmount?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(31)
  receiptDay: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(31)
  dueDay: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}