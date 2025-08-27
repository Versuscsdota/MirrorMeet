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
exports.ProfilesController = void 0;
const common_1 = require("@nestjs/common");
const profiles_service_1 = require("./profiles.service");
const create_profile_dto_1 = require("./dto/create-profile.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const audit_service_1 = require("../audit/audit.service");
let ProfilesController = class ProfilesController {
    profiles;
    audit;
    constructor(profiles, audit) {
        this.profiles = profiles;
        this.audit = audit;
    }
    async list(skip, take, search) {
        return this.profiles.list({
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            search,
        });
    }
    async get(id) {
        return this.profiles.get(id);
    }
    async create(dto, req) {
        const created = await this.profiles.create(dto);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `Profile:${created.id}`,
            action: 'CREATE',
            diff: dto,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return created;
    }
    async update(id, dto, req) {
        const updated = await this.profiles.update(id, dto);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `Profile:${id}`,
            action: 'UPDATE',
            diff: dto,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return updated;
    }
    async remove(id, req) {
        const res = await this.profiles.remove(id);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `Profile:${id}`,
            action: 'DELETE',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return res;
    }
};
exports.ProfilesController = ProfilesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CURATOR', 'ADMIN', 'ROOT'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_profile_dto_1.CreateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('CURATOR', 'ADMIN', 'ROOT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ROOT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "remove", null);
exports.ProfilesController = ProfilesController = __decorate([
    (0, common_1.Controller)('profiles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [profiles_service_1.ProfilesService, audit_service_1.AuditService])
], ProfilesController);
//# sourceMappingURL=profiles.controller.js.map