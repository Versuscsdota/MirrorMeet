import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}

export class SetStatusDto {
  @IsIn([
    'INTERVIEW_SCHEDULED',
    'SHIFT_TRIAL_1',
    'SHIFT_TRIAL_2',
    'HIRED',
    'REJECTED',
    'CANCELED',
  ])
  status!: 'INTERVIEW_SCHEDULED' | 'SHIFT_TRIAL_1' | 'SHIFT_TRIAL_2' | 'HIRED' | 'REJECTED' | 'CANCELED';

  @IsOptional()
  @IsString()
  notes?: string;
}
