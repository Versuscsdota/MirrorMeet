import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { skip?: number; take?: number; profileId?: string; interviewerId?: string; status?: string }) {
    const { skip, take, profileId, interviewerId, status } = params;
    return this.prisma.scheduleEvent.findMany({
      where: {
        profileId: profileId || undefined,
        interviewerId: interviewerId || undefined,
        status: (status as any) || undefined,
      },
      orderBy: { start: 'desc' },
      skip,
      take: take ?? 50,
    });
  }

  async get(id: string) {
    const ev = await this.prisma.scheduleEvent.findUnique({ where: { id } });
    if (!ev) throw new NotFoundException('ScheduleEvent not found');
    return ev;
  }

  async create(data: {
    profileId: string;
    interviewerId?: string;
    title?: string;
    location?: string;
    start: string | Date;
    end: string | Date;
    status?: string;
    notes?: string;
  }) {
    return this.prisma.scheduleEvent.create({
      data: {
        profileId: data.profileId,
        interviewerId: data.interviewerId,
        title: data.title,
        location: data.location,
        status: (data.status as any) || undefined,
        notes: data.notes,
        start: new Date(data.start),
        end: new Date(data.end),
      },
    });
  }

  async update(
    id: string,
    data: Partial<{ interviewerId?: string; title?: string; location?: string; start: string | Date; end: string | Date; status?: string; notes?: string }>,
  ) {
    await this.get(id);
    return this.prisma.scheduleEvent.update({
      where: { id },
      data: {
        interviewerId: data.interviewerId,
        title: data.title,
        location: data.location,
        status: (data.status as any) || undefined,
        notes: data.notes,
        start: data.start ? new Date(data.start) : undefined,
        end: data.end ? new Date(data.end) : undefined,
      },
    });
  }

  async setStatus(id: string, status: string, notes?: string) {
    await this.get(id);
    return this.prisma.scheduleEvent.update({ where: { id }, data: { status: status as any, notes } });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.scheduleEvent.delete({ where: { id } });
    return { ok: true };
  }
}
