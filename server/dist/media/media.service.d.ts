import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { CreateMediaDto } from './dto/create-media.dto';
export declare class MediaService {
    private prisma;
    private config;
    private readonly s3;
    private readonly bucket;
    constructor(prisma: PrismaService, config: ConfigService);
    presignUpload(dto: PresignUploadDto, userId?: string): Promise<{
        uploadUrl: string;
        storageKey: string;
        publicUrl: string;
        expiresIn: number;
    }>;
    create(dto: CreateMediaDto): Promise<{
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
    list(params: {
        profileId?: string;
        type?: string;
        skip?: number;
        take?: number;
    }): Promise<{
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
    remove(id: string, deleteObject?: boolean): Promise<{
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
