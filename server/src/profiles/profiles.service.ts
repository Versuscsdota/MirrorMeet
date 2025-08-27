import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { skip?: number; take?: number; search?: string }) {
    const where = params.search
      ? {
          OR: [
            { fullName: { contains: params.search, mode: 'insensitive' as const } },
            { email: { contains: params.search, mode: 'insensitive' as const } },
            { phone: { contains: params.search, mode: 'insensitive' as const } },
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

  async get(id: string) {
    const prof = await this.prisma.profile.findUnique({ where: { id } });
    if (!prof) throw new NotFoundException('Profile not found');
    return prof;
  }

  async create(data: {
    fullName: string;
    phone?: string;
    email?: string;
    notes?: string;
    tags?: string[];
    curatorId?: string | null;
  }) {
    return this.prisma.profile.create({ data });
  }

  async update(id: string, data: Partial<{ fullName: string; phone?: string; email?: string; notes?: string; tags?: string[] }>) {
    await this.get(id);
    return this.prisma.profile.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.profile.delete({ where: { id } });
    return { ok: true };
  }
}
