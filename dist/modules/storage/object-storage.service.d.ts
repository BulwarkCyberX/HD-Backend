import { ConfigService } from '@nestjs/config';
export type StorageDriver = 's3' | 'r2' | 'minio' | 'local';
export declare class ObjectStorageService {
    private readonly config;
    private readonly client;
    private readonly bucket;
    private readonly driver;
    constructor(config: ConfigService);
    isRemoteEnabled(): boolean;
    presignPut(key: string, contentType: string, expiresSeconds?: number): Promise<string>;
    presignGet(key: string, expiresSeconds?: number): Promise<string>;
    makeObjectKey(prefix: string, originalName: string): string;
}
