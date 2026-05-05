type HealthStatus = {
    ok: boolean;
    service: string;
};
export declare class AppService {
    getHealth(): HealthStatus;
}
export {};
