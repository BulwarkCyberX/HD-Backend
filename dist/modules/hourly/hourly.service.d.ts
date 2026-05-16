import { HourlyEngagementStatus, Prisma, UserRole, type PaymentCurrency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
export declare class HourlyService {
    private readonly prisma;
    private readonly wallets;
    constructor(prisma: PrismaService, wallets: WalletService);
    ensureEngagementForProject(input: {
        projectId: string;
        hourlyRate: number;
        currency?: PaymentCurrency;
        weeklyCapHours?: number;
    }): Promise<{
        id: string;
    } | null>;
    getByProject(input: {
        projectId: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        timeEntries: {
            id: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            hours: Prisma.Decimal;
            status: import(".prisma/client").$Enums.TimeEntryStatus;
            providerId: string;
            submittedAt: Date | null;
            approvedAt: Date | null;
            engagementId: string;
            workDate: Date;
            rejectedReason: string | null;
            billedAt: Date | null;
            billedAmount: Prisma.Decimal | null;
        }[];
        status: import(".prisma/client").$Enums.HourlyEngagementStatus;
        projectId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        hourlyRate: Prisma.Decimal;
        weeklyCapHours: number;
    }>;
    upsertEngagement(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        hourlyRate: number;
        weeklyCapHours?: number;
        currency?: PaymentCurrency;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        timeEntries: {
            id: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            hours: Prisma.Decimal;
            status: import(".prisma/client").$Enums.TimeEntryStatus;
            providerId: string;
            submittedAt: Date | null;
            approvedAt: Date | null;
            engagementId: string;
            workDate: Date;
            rejectedReason: string | null;
            billedAt: Date | null;
            billedAmount: Prisma.Decimal | null;
        }[];
        status: import(".prisma/client").$Enums.HourlyEngagementStatus;
        projectId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        hourlyRate: Prisma.Decimal;
        weeklyCapHours: number;
    }>;
    createTimeEntry(input: {
        requesterId: string;
        role: UserRole;
        engagementId: string;
        workDate: string;
        hours: number;
        description: string;
    }): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        hours: Prisma.Decimal;
        status: import(".prisma/client").$Enums.TimeEntryStatus;
        providerId: string;
        submittedAt: Date | null;
        approvedAt: Date | null;
        engagementId: string;
        workDate: Date;
        rejectedReason: string | null;
        billedAt: Date | null;
        billedAmount: Prisma.Decimal | null;
    }>;
    updateTimeEntry(input: {
        requesterId: string;
        role: UserRole;
        entryId: string;
        workDate?: string;
        hours?: number;
        description?: string;
    }): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        hours: Prisma.Decimal;
        status: import(".prisma/client").$Enums.TimeEntryStatus;
        providerId: string;
        submittedAt: Date | null;
        approvedAt: Date | null;
        engagementId: string;
        workDate: Date;
        rejectedReason: string | null;
        billedAt: Date | null;
        billedAmount: Prisma.Decimal | null;
    }>;
    submitTimeEntry(input: {
        requesterId: string;
        role: UserRole;
        entryId: string;
    }): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        hours: Prisma.Decimal;
        status: import(".prisma/client").$Enums.TimeEntryStatus;
        providerId: string;
        submittedAt: Date | null;
        approvedAt: Date | null;
        engagementId: string;
        workDate: Date;
        rejectedReason: string | null;
        billedAt: Date | null;
        billedAmount: Prisma.Decimal | null;
    }>;
    approveTimeEntry(input: {
        requesterId: string;
        role: UserRole;
        entryId: string;
    }): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        hours: Prisma.Decimal;
        status: import(".prisma/client").$Enums.TimeEntryStatus;
        providerId: string;
        submittedAt: Date | null;
        approvedAt: Date | null;
        engagementId: string;
        workDate: Date;
        rejectedReason: string | null;
        billedAt: Date | null;
        billedAmount: Prisma.Decimal | null;
    }>;
    rejectTimeEntry(input: {
        requesterId: string;
        role: UserRole;
        entryId: string;
        reason?: string;
    }): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        hours: Prisma.Decimal;
        status: import(".prisma/client").$Enums.TimeEntryStatus;
        providerId: string;
        submittedAt: Date | null;
        approvedAt: Date | null;
        engagementId: string;
        workDate: Date;
        rejectedReason: string | null;
        billedAt: Date | null;
        billedAmount: Prisma.Decimal | null;
    }>;
    setEngagementStatus(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        status: HourlyEngagementStatus;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        timeEntries: {
            id: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            hours: Prisma.Decimal;
            status: import(".prisma/client").$Enums.TimeEntryStatus;
            providerId: string;
            submittedAt: Date | null;
            approvedAt: Date | null;
            engagementId: string;
            workDate: Date;
            rejectedReason: string | null;
            billedAt: Date | null;
            billedAmount: Prisma.Decimal | null;
        }[];
        status: import(".prisma/client").$Enums.HourlyEngagementStatus;
        projectId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        hourlyRate: Prisma.Decimal;
        weeklyCapHours: number;
    }>;
    getProjectSummary(input: {
        projectId: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        projectId: string;
        hourlyRate: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        engagementStatus: import(".prisma/client").$Enums.HourlyEngagementStatus;
        weeklyCapHours: number;
        draftHours: number;
        submittedHours: number;
        approvedHours: number;
        billedHours: number;
        billedAmount: number;
        pendingAmount: number;
        entryCount: number;
    }>;
    billTimeEntry(input: {
        requesterId: string;
        role: UserRole;
        entryId: string;
    }): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        hours: Prisma.Decimal;
        status: import(".prisma/client").$Enums.TimeEntryStatus;
        providerId: string;
        submittedAt: Date | null;
        approvedAt: Date | null;
        engagementId: string;
        workDate: Date;
        rejectedReason: string | null;
        billedAt: Date | null;
        billedAmount: Prisma.Decimal | null;
    }>;
    private sumBilledAmount;
    private assertWeeklyCap;
    private weekStart;
    private getEngagementOrThrow;
    private getEntryOrThrow;
    private assertParticipant;
    private assertOwner;
    private assertSelectedProvider;
}
