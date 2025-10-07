import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99999999.99, { message: 'Salário base não pode exceder R$ 99.999.999,99' })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  salaryPayDay?: number;

  @IsOptional()
  @IsString()
  branchId?: string;
}
