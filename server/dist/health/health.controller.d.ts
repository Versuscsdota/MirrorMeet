import { HealthService } from './health.service';
export declare class HealthController {
    private readonly health;
    constructor(health: HealthService);
    getHealth(): Promise<{
        status: string;
        db: string;
        error?: undefined;
    } | {
        status: string;
        db: string;
        error: string;
    }>;
}
