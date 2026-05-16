import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export type StorageDriver = 's3' | 'r2' | 'minio' | 'local';

@Injectable()
export class ObjectStorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string | null;
  private readonly driver: StorageDriver;

  constructor(private readonly config: ConfigService) {
    this.driver = (this.config.get<string>('STORAGE_DRIVER') ?? 'local') as StorageDriver;
    this.bucket = this.config.get<string>('S3_BUCKET') ?? null;
    const region = this.config.get<string>('S3_REGION') ?? 'auto';
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY');
    if (this.driver !== 'local' && accessKeyId && secretAccessKey && this.bucket) {
      this.client = new S3Client({
        region,
        endpoint: endpoint || undefined,
        forcePathStyle: Boolean(endpoint),
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.client = null;
    }
  }

  isRemoteEnabled(): boolean {
    return this.client !== null && this.bucket !== null;
  }

  async presignPut(key: string, contentType: string, expiresSeconds = 900): Promise<string> {
    if (!this.client || !this.bucket) {
      throw new ServiceUnavailableException('Object storage is not configured');
    }
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, cmd, { expiresIn: expiresSeconds });
  }

  async presignGet(key: string, expiresSeconds = 900): Promise<string> {
    if (!this.client || !this.bucket) {
      throw new ServiceUnavailableException('Object storage is not configured');
    }
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: expiresSeconds });
  }

  makeObjectKey(prefix: string, originalName: string): string {
    const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
    return `${prefix}/${randomUUID()}/${safe}`;
  }
}
