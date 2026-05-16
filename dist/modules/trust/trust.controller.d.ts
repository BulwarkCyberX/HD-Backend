import { type RequestUser } from '../../auth/current-user.decorator';
import { TrustService } from './trust.service';
import { ModerationAuditDto } from './dto/moderation-audit.dto';
export declare class TrustController {
    private readonly trust;
    constructor(trust: TrustService);
    audit(user: RequestUser, dto: ModerationAuditDto): Promise<{
        id: string;
        createdAt: Date;
    }>;
}
