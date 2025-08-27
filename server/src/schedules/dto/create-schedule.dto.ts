import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  profileId!: string;

  @IsOptional()
  @IsString()
  interviewerId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsOptional()
  @IsIn([
    'INTERVIEW_SCHEDULED',
    'SHIFT_TRIAL_1',
    'SHIFT_TRIAL_2',
    'HIRED',
    'REJECTED',
    'CANCELED',
  ])
  status?:
    | 'INTERVIEW_SCHEDULED'
    | 'SHIFT_TRIAL_1'
    | 'SHIFT_TRIAL_2'
    | 'HIRED'
    | 'REJECTED'
    | 'CANCELED';

  @IsOptional()
  @IsString()
  notes?: string;
}
