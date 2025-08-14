import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  salaryPayDay?: number;

  @IsOptional()
  @IsString()
  branchId?: string;
}
