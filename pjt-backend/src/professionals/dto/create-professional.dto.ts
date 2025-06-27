import { ApiProperty } from '@nestjs/swagger';

export class CreateProfessionalDto {
  @ApiProperty({ description: 'Nome do profissional' })
  name: string;

  @ApiProperty({ description: 'Função/cargo do profissional' })
  role: string;
}