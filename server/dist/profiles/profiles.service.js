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
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProfilesService = class ProfilesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(params) {
        const where = params.search
            ? {
                OR: [
                    { fullName: { contains: params.search, mode: 'insensitive' } },
                    { email: { contains: params.search, mode: 'insensitive' } },
                    { phone: { contains: params.search, mode: 'insensitive' } },
                ],
            }
            : undefined;
        return this.prisma.profile.findMany({
            where,
            skip: params.skip,
            take: params.take ?? 50,
            orderBy: { createdAt: 'desc' },
        });
    }
    async get(id) {
        const prof = await this.prisma.profile.findUnique({ where: { id } });
        if (!prof)
            throw new common_1.NotFoundException('Profile not found');
        return prof;
    }
    async create(data) {
        return this.prisma.profile.create({ data });
    }
    async update(id, data) {
        await this.get(id);
        return this.prisma.profile.update({ where: { id }, data });
    }
    async remove(id) {
        await this.get(id);
        await this.prisma.profile.delete({ where: { id } });
        return { ok: true };
    }
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map