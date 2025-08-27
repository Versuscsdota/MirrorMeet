import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { MediaType } from '@prisma/client';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  profileId!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  size?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  durationMs?: number;

  @IsString()
  @IsOptional()
  transcript?: string;
}
