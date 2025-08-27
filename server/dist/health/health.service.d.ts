import { PrismaService } from '../prisma/prisma.service';
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        db: string;
        error?: undefined;
    } | {
        status: string;
        db: string;
        error: string;
    }>;
}
