import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { CreateMediaDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    const endpoint = this.config.get<string>('MINIO_ENDPOINT') || 'http://localhost:9000';
    const region = this.config.get<string>('MINIO_REGION') || 'us-east-1';
    const accessKeyId = this.config.get<string>('MINIO_ACCESS_KEY') || 'minioadmin';
    const secretAccessKey = this.config.get<string>('MINIO_SECRET_KEY') || 'minioadmin123';
    this.bucket = this.config.get<string>('MINIO_BUCKET') || 'mirrormeet';

    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async presignUpload(dto: PresignUploadDto, userId?: string) {
    const filename = dto.filename || `${Date.now()}`;
    const key = `profiles/${dto.profileId}/${filename}`;

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.mimeType,
      ACL: 'public-read',
    } as any);

    const expiresIn = 60 * 5; // 5 minutes
    const url = await getSignedUrl(this.s3, cmd, { expiresIn });

    // Public URL assuming bucket has anonymous download
    const endpoint = this.config.get<string>('MINIO_PUBLIC_ENDPOINT') || this.config.get<string>('MINIO_ENDPOINT') || 'http://localhost:9000';
    const publicUrl = `${endpoint}/${this.bucket}/${key}`;

    return {
      uploadUrl: url,
      storageKey: key,
      publicUrl,
      expiresIn,
    };
  }

  async create(dto: CreateMediaDto) {
    return this.prisma.mediaAsset.create({
      data: {
        profileId: dto.profileId,
        type: dto.type,
        url: dto.url,
        storageKey: dto.storageKey,
        size: dto.size,
        durationMs: dto.durationMs,
        mimeType: dto.mimeType,
        transcript: dto.transcript,
      },
    });
  }

  async list(params: { profileId?: string; type?: string; skip?: number; take?: number }) {
    const { profileId, type, skip, take } = params;
    return this.prisma.mediaAsset.findMany({
      where: { profileId: profileId || undefined, type: (type as any) || undefined },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: take,
    });
  }

  async remove(id: string, deleteObject = true) {
    const media = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!media) return null;

    if (deleteObject && media.storageKey) {
      try {
        await this.s3.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: media.storageKey })
        );
      } catch (e) {
        // swallow S3 errors to not block metadata deletion
      }
    }
    return this.prisma.mediaAsset.delete({ where: { id } });
  }
}
