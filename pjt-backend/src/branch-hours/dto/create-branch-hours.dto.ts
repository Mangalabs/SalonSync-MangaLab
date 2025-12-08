import { IsNotEmpty, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class CreateBranchHoursDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  @IsNotEmpty()
  @IsString()
  startTime: string; // Formato HH:mm

  @IsNotEmpty()
  @IsString()
  endTime: string; // Formato HH:mm

  @IsBoolean()
  isOpen: boolean = true;

  @IsString()
  lunchStartTime?: string; // Formato HH:mm

  @IsString()
  lunchEndTime?: string; // Formato HH:mm
}