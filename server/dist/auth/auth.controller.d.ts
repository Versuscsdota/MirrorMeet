import { AuthService } from './auth.service';
declare class LoginDto {
    email: string;
    password: string;
}
declare class RegisterDto extends LoginDto {
    firstName?: string;
    lastName?: string;
}
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: any;
    }>;
}
export {};
