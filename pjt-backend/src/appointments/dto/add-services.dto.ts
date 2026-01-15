import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AddServicesDto {
  @ApiProperty({
    description: 'IDs dos serviços a serem adicionados',
    example: ['service-id-1', 'service-id-2'],
  })
  @IsArray()
  @IsString({ each: true })
  serviceIds: string[];
}
