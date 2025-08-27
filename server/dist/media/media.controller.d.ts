import { MediaService } from './media.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { AuditService } from '../audit/audit.service';
export declare class MediaController {
    private readonly media;
    private readonly audit;
    constructor(media: MediaService, audit: AuditService);
    presignUpload(dto: PresignUploadDto, req: any): Promise<{
        uploadUrl: string;
        storageKey: string;
        publicUrl: string;
        expiresIn: number;
    }>;
    create(dto: CreateMediaDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        profileId: string;
        type: import(".prisma/client").$Enums.MediaType;
        mimeType: string | null;
        size: number | null;
        storageKey: string;
        url: string;
        durationMs: number | null;
        transcript: string | null;
    }>;
    list(profileId?: string, type?: string, skip?: string, take?: string): Promise<{
        id: string;
        createdAt: Date;
        profileId: string;
        type: import(".prisma/client").$Enums.MediaType;
        mimeType: string | null;
        size: number | null;
        storageKey: string;
        url: string;
        durationMs: number | null;
        transcript: string | null;
    }[]>;
    remove(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        profileId: string;
        type: import(".prisma/client").$Enums.MediaType;
        mimeType: string | null;
        size: number | null;
        storageKey: string;
        url: string;
        durationMs: number | null;
        transcript: string | null;
    } | null>;
}
