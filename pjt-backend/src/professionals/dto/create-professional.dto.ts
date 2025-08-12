import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProfessionalDto {
  @ApiProperty({ description: 'Nome do profissional' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Função/cargo do profissional' })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({ description: 'Porcentagem de comissão (0-100)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  commissionRate?: number;

  @ApiProperty({ description: 'ID da função', required: false })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiProperty({ description: 'Salário base personalizado', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @ApiProperty({ description: 'Dia do pagamento personalizado', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  salaryPayDay?: number;

  @ApiProperty({ description: 'ID da filial', required: false })
  @IsOptional()
  @IsString()
  branchId?: string;
}
