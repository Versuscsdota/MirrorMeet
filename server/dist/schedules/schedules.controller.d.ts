import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto, SetStatusDto } from './dto/update-schedule.dto';
import { AuditService } from '../audit/audit.service';
export declare class SchedulesController {
    private readonly schedules;
    private readonly audit;
    constructor(schedules: SchedulesService, audit: AuditService);
    list(skip?: string, take?: string, profileId?: string, interviewerId?: string, status?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        profileId: string;
        interviewerId: string | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        title: string | null;
        location: string | null;
        start: Date;
        end: Date;
    }[]>;
    get(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        profileId: string;
        interviewerId: string | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        title: string | null;
        location: string | null;
        start: Date;
        end: Date;
    }>;
    create(dto: CreateScheduleDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        profileId: string;
        interviewerId: string | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        title: string | null;
        location: string | null;
        start: Date;
        end: Date;
    }>;
    update(id: string, dto: UpdateScheduleDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        profileId: string;
        interviewerId: string | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        title: string | null;
        location: string | null;
        start: Date;
        end: Date;
    }>;
    setStatus(id: string, dto: SetStatusDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        profileId: string;
        interviewerId: string | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        title: string | null;
        location: string | null;
        start: Date;
        end: Date;
    }>;
    remove(id: string, req: any): Promise<{
        ok: boolean;
    }>;
}
