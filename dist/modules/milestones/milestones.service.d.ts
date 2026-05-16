import { Prisma, UserRole, type PaymentCurrency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { DomainEventsService } from '../realtime/domain-events.service';
export declare class MilestonesService {
    private readonly prisma;
    private readonly wallets;
    private readonly events;
    constructor(prisma: PrismaService, wallets: WalletService, events: DomainEventsService);
    private readonly select;
    listByProject(input: {
        projectId: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }[]>;
    create(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        title: string;
        description: string;
        amount: number;
        currency: PaymentCurrency;
        sortOrder: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }>;
    update(input: {
        requesterId: string;
        role: UserRole;
        milestoneId: string;
        title?: string;
        description?: string;
        amount?: number;
        currency?: PaymentCurrency;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }>;
    remove(input: {
        requesterId: string;
        role: UserRole;
        milestoneId: string;
    }): Promise<{
        ok: true;
    }>;
    fund(input: {
        requesterId: string;
        role: UserRole;
        milestoneId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }>;
    startProgress(input: {
        requesterId: string;
        role: UserRole;
        milestoneId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }>;
    submit(input: {
        requesterId: string;
        role: UserRole;
        milestoneId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }>;
    approve(input: {
        requesterId: string;
        role: UserRole;
        milestoneId: string;
        partialPercent?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }>;
    release(input: {
        requesterId: string;
        role: UserRole;
        milestoneId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }>;
    reject(input: {
        requesterId: string;
        role: UserRole;
        milestoneId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        projectId: string;
        amount: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        sortOrder: number;
        partialPercent: number | null;
        releasedAmount: Prisma.Decimal | null;
        fundedAt: Date | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        releasedAt: Date | null;
    }>;
    listComments(input: {
        milestoneId: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        author: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }[]>;
    addComment(input: {
        milestoneId: string;
        requesterId: string;
        role: UserRole;
        body: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        author: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    private serializeMilestone;
    private emitMilestone;
    private sumAllocated;
    private getMilestoneOrThrow;
    private assertParticipant;
    private assertOwner;
    private assertSelectedProvider;
}
