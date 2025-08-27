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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const media_service_1 = require("./media.service");
const presign_upload_dto_1 = require("./dto/presign-upload.dto");
const create_media_dto_1 = require("./dto/create-media.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const audit_service_1 = require("../audit/audit.service");
let MediaController = class MediaController {
    media;
    audit;
    constructor(media, audit) {
        this.media = media;
        this.audit = audit;
    }
    async presignUpload(dto, req) {
        const res = await this.media.presignUpload(dto);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `Profile:${dto.profileId}`,
            action: 'PRESIGN_UPLOAD',
            diff: { filename: dto.filename, mimeType: dto.mimeType, size: dto.size, type: dto.type },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return res;
    }
    async create(dto, req) {
        const created = await this.media.create(dto);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `MediaAsset:${created.id}`,
            action: 'CREATE',
            diff: { profileId: dto.profileId, type: dto.type, storageKey: dto.storageKey, url: dto.url },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return created;
    }
    async list(profileId, type, skip, take) {
        return this.media.list({
            profileId,
            type,
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
        });
    }
    async remove(id, req) {
        const removed = await this.media.remove(id, true);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `MediaAsset:${id}`,
            action: 'DELETE',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return removed;
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('presign-upload'),
    (0, roles_decorator_1.Roles)('CURATOR', 'ADMIN', 'ROOT'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [presign_upload_dto_1.PresignUploadDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "presignUpload", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CURATOR', 'ADMIN', 'ROOT'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_media_dto_1.CreateMediaDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('profileId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('skip')),
    __param(3, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ROOT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "remove", null);
exports.MediaController = MediaController = __decorate([
    (0, common_1.Controller)('media'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [media_service_1.MediaService, audit_service_1.AuditService])
], MediaController);
//# sourceMappingURL=media.controller.js.map