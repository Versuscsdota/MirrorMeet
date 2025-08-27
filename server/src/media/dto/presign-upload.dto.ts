import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { MediaType } from '@prisma/client';

export class PresignUploadDto {
  @IsString()
  @IsNotEmpty()
  profileId!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsOptional()
  @IsString()
  filename?: string;
}
