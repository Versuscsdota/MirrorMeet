export declare class CreateScheduleDto {
    profileId: string;
    interviewerId?: string;
    title?: string;
    location?: string;
    start: string;
    end: string;
    status?: 'INTERVIEW_SCHEDULED' | 'SHIFT_TRIAL_1' | 'SHIFT_TRIAL_2' | 'HIRED' | 'REJECTED' | 'CANCELED';
    notes?: string;
}
