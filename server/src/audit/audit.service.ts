import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId?: string | null;
    entity: string;
    action: string;
    diff?: any;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const { actorId, entity, action, diff, ip, userAgent } = params;
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: actorId || undefined,
          entity,
          action,
          diff: diff || undefined,
          ip: ip || undefined,
          userAgent: userAgent || undefined,
        },
      });
    } catch (e) {
      // аудит не должен ломать основной поток
    }
  }
}
