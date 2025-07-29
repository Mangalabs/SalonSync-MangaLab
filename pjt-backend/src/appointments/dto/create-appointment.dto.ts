import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID do profissional' })
  professionalId: string;

  @ApiProperty({ description: 'ID do cliente' })
  clientId: string;

  @ApiProperty({ description: 'IDs dos serviços', type: [String] })
  serviceIds: string[];

  @ApiProperty({
    description: 'Data e hora do agendamento',
    example: '2024-12-25T10:00:00Z',
  })
  scheduledAt: string;
}
