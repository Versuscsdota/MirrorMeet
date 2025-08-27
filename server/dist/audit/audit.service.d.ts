import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(params: {
        actorId?: string | null;
        entity: string;
        action: string;
        diff?: any;
        ip?: string | null;
        userAgent?: string | null;
    }): Promise<void>;
}
