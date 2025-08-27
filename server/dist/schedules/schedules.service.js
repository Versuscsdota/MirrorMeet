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
exports.SchedulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SchedulesService = class SchedulesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(params) {
        const { skip, take, profileId, interviewerId, status } = params;
        return this.prisma.scheduleEvent.findMany({
            where: {
                profileId: profileId || undefined,
                interviewerId: interviewerId || undefined,
                status: status || undefined,
            },
            orderBy: { start: 'desc' },
            skip,
            take: take ?? 50,
        });
    }
    async get(id) {
        const ev = await this.prisma.scheduleEvent.findUnique({ where: { id } });
        if (!ev)
            throw new common_1.NotFoundException('ScheduleEvent not found');
        return ev;
    }
    async create(data) {
        return this.prisma.scheduleEvent.create({
            data: {
                profileId: data.profileId,
                interviewerId: data.interviewerId,
                title: data.title,
                location: data.location,
                status: data.status || undefined,
                notes: data.notes,
                start: new Date(data.start),
                end: new Date(data.end),
            },
        });
    }
    async update(id, data) {
        await this.get(id);
        return this.prisma.scheduleEvent.update({
            where: { id },
            data: {
                interviewerId: data.interviewerId,
                title: data.title,
                location: data.location,
                status: data.status || undefined,
                notes: data.notes,
                start: data.start ? new Date(data.start) : undefined,
                end: data.end ? new Date(data.end) : undefined,
            },
        });
    }
    async setStatus(id, status, notes) {
        await this.get(id);
        return this.prisma.scheduleEvent.update({ where: { id }, data: { status: status, notes } });
    }
    async remove(id) {
        await this.get(id);
        await this.prisma.scheduleEvent.delete({ where: { id } });
        return { ok: true };
    }
};
exports.SchedulesService = SchedulesService;
exports.SchedulesService = SchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SchedulesService);
//# sourceMappingURL=schedules.service.js.map