import { UsersService } from './users.service';
declare class CreateUserDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: 'CURATOR' | 'INTERVIEWER' | 'ADMIN' | 'ROOT';
}
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    getById(id: string): Promise<any>;
    create(dto: CreateUserDto): Promise<any>;
}
export {};
