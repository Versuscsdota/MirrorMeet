import { PrismaService } from '../prisma/prisma.service';
export declare class SchedulesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(params: {
        skip?: number;
        take?: number;
        profileId?: string;
        interviewerId?: string;
        status?: string;
    }): Promise<{
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
    create(data: {
        profileId: string;
        interviewerId?: string;
        title?: string;
        location?: string;
        start: string | Date;
        end: string | Date;
        status?: string;
        notes?: string;
    }): Promise<{
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
    update(id: string, data: Partial<{
        interviewerId?: string;
        title?: string;
        location?: string;
        start: string | Date;
        end: string | Date;
        status?: string;
        notes?: string;
    }>): Promise<{
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
    setStatus(id: string, status: string, notes?: string): Promise<{
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
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
