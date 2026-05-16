import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class KycService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStatus(userId: string): Promise<{
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
    submit(input: {
        userId: string;
        panNumber: string;
        panHolderName: string;
        bankAccountNumber: string;
        bankIfsc: string;
        bankAccountHolder: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.KycStatus;
        panNumberMasked: string | null;
        panHolderName: string | null;
        bankAccountLast4: string | null;
        bankIfsc: string | null;
        bankAccountHolder: string | null;
    }>;
    listPendingAdmin(role: UserRole): Promise<{
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
    review(input: {
        adminId: string;
        role: UserRole;
        submissionId: string;
        approve: boolean;
        adminNotes?: string;
    }): Promise<{
        id: string;
        userId: string;
        status: import(".prisma/client").$Enums.KycStatus;
        adminNotes: string | null;
        reviewedAt: Date | null;
    }>;
    assertWithdrawalAllowed(userId: string): Promise<void>;
}
