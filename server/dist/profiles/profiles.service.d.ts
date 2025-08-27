import { PrismaService } from '../prisma/prisma.service';
export declare class ProfilesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(params: {
        skip?: number;
        take?: number;
        search?: string;
    }): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        fullName: string;
        notes: string | null;
        tags: string[];
        curatorId: string | null;
    }[]>;
    get(id: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        fullName: string;
        notes: string | null;
        tags: string[];
        curatorId: string | null;
    }>;
    create(data: {
        fullName: string;
        phone?: string;
        email?: string;
        notes?: string;
        tags?: string[];
        curatorId?: string | null;
    }): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        fullName: string;
        notes: string | null;
        tags: string[];
        curatorId: string | null;
    }>;
    update(id: string, data: Partial<{
        fullName: string;
        phone?: string;
        email?: string;
        notes?: string;
        tags?: string[];
    }>): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        fullName: string;
        notes: string | null;
        tags: string[];
        curatorId: string | null;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
