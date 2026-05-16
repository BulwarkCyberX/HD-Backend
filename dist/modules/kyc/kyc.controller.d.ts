import { type RequestUser } from '../../auth/current-user.decorator';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { KycService } from './kyc.service';
export declare class KycController {
    private readonly kyc;
    constructor(kyc: KycService);
    me(user: RequestUser): Promise<{
        status: import(".prisma/client").$Enums.KycStatus;
        submission: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.KycStatus;
            panNumberMasked: string | null;
            panHolderName: string | null;
            bankAccountLast4: string | null;
            bankIfsc: string | null;
            bankAccountHolder: string | null;
            adminNotes: string | null;
            reviewedAt: Date | null;
        } | null;
        approved: boolean;
    }>;
    submit(user: RequestUser, dto: SubmitKycDto): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.KycStatus;
        panNumberMasked: string | null;
        panHolderName: string | null;
        bankAccountLast4: string | null;
        bankIfsc: string | null;
        bankAccountHolder: string | null;
    }>;
    pending(user: RequestUser): Promise<{
        user: {
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
        };
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.KycStatus;
        panNumberMasked: string | null;
        panHolderName: string | null;
        bankAccountLast4: string | null;
        bankIfsc: string | null;
        bankAccountHolder: string | null;
    }[]>;
    review(user: RequestUser, id: string, dto: ReviewKycDto): Promise<{
        id: string;
        userId: string;
        status: import(".prisma/client").$Enums.KycStatus;
        adminNotes: string | null;
        reviewedAt: Date | null;
    }>;
}
