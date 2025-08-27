import { MediaType } from '@prisma/client';
export declare class PresignUploadDto {
    profileId: string;
    type: MediaType;
    mimeType: string;
    size: number;
    filename?: string;
}
