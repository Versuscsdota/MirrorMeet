import { MediaType } from '@prisma/client';
export declare class CreateMediaDto {
    profileId: string;
    type: MediaType;
    storageKey: string;
    url: string;
    mimeType?: string;
    size?: number;
    durationMs?: number;
    transcript?: string;
}
