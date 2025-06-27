import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfessionalDto {
  @ApiPropertyOptional({ description: 'Nome do profissional' })
  name?: string;

  @ApiPropertyOptional({ description: 'Função/cargo do profissional' })
  role?: string;

  @ApiPropertyOptional({ description: 'Status ativo do profissional' })
  active?: boolean;
}