import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuditService } from '../audit/audit.service';
export declare class ProfilesController {
    private readonly profiles;
    private readonly audit;
    constructor(profiles: ProfilesService, audit: AuditService);
    list(skip?: string, take?: string, search?: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        fullName: string;
        notes: string | null;
        tags: string[];
        curatorId: string | null;
    }[]>;
    get(id: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        fullName: string;
        notes: string | null;
        tags: string[];
        curatorId: string | null;
    }>;
    create(dto: CreateProfileDto, req: any): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        fullName: string;
        notes: string | null;
        tags: string[];
        curatorId: string | null;
    }>;
    update(id: string, dto: UpdateProfileDto, req: any): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        fullName: string;
        notes: string | null;
        tags: string[];
        curatorId: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        ok: boolean;
    }>;
}
