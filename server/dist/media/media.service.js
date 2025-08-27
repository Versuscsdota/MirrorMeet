"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let MediaService = class MediaService {
    prisma;
    config;
    s3;
    bucket;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        const endpoint = this.config.get('MINIO_ENDPOINT') || 'http://localhost:9000';
        const region = this.config.get('MINIO_REGION') || 'us-east-1';
        const accessKeyId = this.config.get('MINIO_ACCESS_KEY') || 'minioadmin';
        const secretAccessKey = this.config.get('MINIO_SECRET_KEY') || 'minioadmin123';
        this.bucket = this.config.get('MINIO_BUCKET') || 'mirrormeet';
        this.s3 = new client_s3_1.S3Client({
            region,
            endpoint,
            forcePathStyle: true,
            credentials: { accessKeyId, secretAccessKey },
        });
    }
    async presignUpload(dto, userId) {
        const filename = dto.filename || `${Date.now()}`;
        const key = `profiles/${dto.profileId}/${filename}`;
        const cmd = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: dto.mimeType,
            ACL: 'public-read',
        });
        const expiresIn = 60 * 5;
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, cmd, { expiresIn });
        const endpoint = this.config.get('MINIO_PUBLIC_ENDPOINT') || this.config.get('MINIO_ENDPOINT') || 'http://localhost:9000';
        const publicUrl = `${endpoint}/${this.bucket}/${key}`;
        return {
            uploadUrl: url,
            storageKey: key,
            publicUrl,
            expiresIn,
        };
    }
    async create(dto) {
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
    async list(params) {
        const { profileId, type, skip, take } = params;
        return this.prisma.mediaAsset.findMany({
            where: { profileId: profileId || undefined, type: type || undefined },
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: take,
        });
    }
    async remove(id, deleteObject = true) {
        const media = await this.prisma.mediaAsset.findUnique({ where: { id } });
        if (!media)
            return null;
        if (deleteObject && media.storageKey) {
            try {
                await this.s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: media.storageKey }));
            }
            catch (e) {
            }
        }
        return this.prisma.mediaAsset.delete({ where: { id } });
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], MediaService);
//# sourceMappingURL=media.service.js.map