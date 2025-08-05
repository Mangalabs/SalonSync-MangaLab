import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
}
