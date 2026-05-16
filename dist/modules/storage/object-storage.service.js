"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
let ObjectStorageService = class ObjectStorageService {
    constructor(config) {
        this.config = config;
        this.driver = (this.config.get('STORAGE_DRIVER') ?? 'local');
        this.bucket = this.config.get('S3_BUCKET') ?? null;
        const region = this.config.get('S3_REGION') ?? 'auto';
        const endpoint = this.config.get('S3_ENDPOINT');
        const accessKeyId = this.config.get('S3_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get('S3_SECRET_ACCESS_KEY');
        if (this.driver !== 'local' && accessKeyId && secretAccessKey && this.bucket) {
            this.client = new client_s3_1.S3Client({
                region,
                endpoint: endpoint || undefined,
                forcePathStyle: Boolean(endpoint),
                credentials: { accessKeyId, secretAccessKey },
            });
        }
        else {
            this.client = null;
        }
    }
    isRemoteEnabled() {
        return this.client !== null && this.bucket !== null;
    }
    async presignPut(key, contentType, expiresSeconds = 900) {
        if (!this.client || !this.bucket) {
            throw new common_1.ServiceUnavailableException('Object storage is not configured');
        }
        const cmd = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, cmd, { expiresIn: expiresSeconds });
    }
    async presignGet(key, expiresSeconds = 900) {
        if (!this.client || !this.bucket) {
            throw new common_1.ServiceUnavailableException('Object storage is not configured');
        }
        const cmd = new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, cmd, { expiresIn: expiresSeconds });
    }
    makeObjectKey(prefix, originalName) {
        const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
        return `${prefix}/${(0, crypto_1.randomUUID)()}/${safe}`;
    }
};
exports.ObjectStorageService = ObjectStorageService;
exports.ObjectStorageService = ObjectStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ObjectStorageService);
//# sourceMappingURL=object-storage.service.js.map