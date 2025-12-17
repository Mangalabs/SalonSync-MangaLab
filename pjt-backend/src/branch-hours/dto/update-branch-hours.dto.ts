import { PartialType } from '@nestjs/mapped-types';
import { CreateBranchHoursDto } from './create-branch-hours.dto';

export class UpdateBranchHoursDto extends PartialType(CreateBranchHoursDto) {}