export declare const ROLES_KEY = "roles";
export type AppRole = 'CURATOR' | 'INTERVIEWER' | 'ADMIN' | 'ROOT';
export declare const Roles: (...roles: AppRole[]) => import("@nestjs/common").CustomDecorator<string>;
