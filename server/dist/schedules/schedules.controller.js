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
exports.SchedulesController = void 0;
const common_1 = require("@nestjs/common");
const schedules_service_1 = require("./schedules.service");
const create_schedule_dto_1 = require("./dto/create-schedule.dto");
const update_schedule_dto_1 = require("./dto/update-schedule.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const audit_service_1 = require("../audit/audit.service");
let SchedulesController = class SchedulesController {
    schedules;
    audit;
    constructor(schedules, audit) {
        this.schedules = schedules;
        this.audit = audit;
    }
    async list(skip, take, profileId, interviewerId, status) {
        return this.schedules.list({
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            profileId,
            interviewerId,
            status,
        });
    }
    async get(id) {
        return this.schedules.get(id);
    }
    async create(dto, req) {
        const created = await this.schedules.create(dto);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `ScheduleEvent:${created.id}`,
            action: 'CREATE',
            diff: dto,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return created;
    }
    async update(id, dto, req) {
        const updated = await this.schedules.update(id, dto);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `ScheduleEvent:${id}`,
            action: 'UPDATE',
            diff: dto,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return updated;
    }
    async setStatus(id, dto, req) {
        const updated = await this.schedules.setStatus(id, dto.status, dto.notes);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `ScheduleEvent:${id}`,
            action: 'STATUS_CHANGE',
            diff: { status: dto.status, notes: dto.notes },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return updated;
    }
    async remove(id, req) {
        const res = await this.schedules.remove(id);
        await this.audit.log({
            actorId: req.user?.userId,
            entity: `ScheduleEvent:${id}`,
            action: 'DELETE',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return res;
    }
};
exports.SchedulesController = SchedulesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('profileId')),
    __param(3, (0, common_1.Query)('interviewerId')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CURATOR', 'ADMIN', 'ROOT'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_schedule_dto_1.CreateScheduleDto, Object]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('CURATOR', 'ADMIN', 'ROOT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_schedule_dto_1.UpdateScheduleDto, Object]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, roles_decorator_1.Roles)('CURATOR', 'ADMIN', 'ROOT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_schedule_dto_1.SetStatusDto, Object]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "setStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ROOT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "remove", null);
exports.SchedulesController = SchedulesController = __decorate([
    (0, common_1.Controller)('schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [schedules_service_1.SchedulesService, audit_service_1.AuditService])
], SchedulesController);
//# sourceMappingURL=schedules.controller.js.map