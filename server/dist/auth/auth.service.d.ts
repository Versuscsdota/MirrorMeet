import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import type { AppRole } from './roles.decorator';
export declare class AuthService {
    private readonly users;
    private readonly jwt;
    constructor(users: UsersService, jwt: JwtService);
    validateUser(email: string, password: string): Promise<{
        id: string;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(user: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(params: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        role?: AppRole;
    }): Promise<{
        access_token: string;
        user: any;
    }>;
}
