import { CreateScheduleDto } from './create-schedule.dto';
declare const UpdateScheduleDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateScheduleDto>>;
export declare class UpdateScheduleDto extends UpdateScheduleDto_base {
}
export declare class SetStatusDto {
    status: 'INTERVIEW_SCHEDULED' | 'SHIFT_TRIAL_1' | 'SHIFT_TRIAL_2' | 'HIRED' | 'REJECTED' | 'CANCELED';
    notes?: string;
}
export {};
