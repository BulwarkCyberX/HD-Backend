import { UserRole, type PaymentCurrency } from '@prisma/client';
import { WebhookDispatcherService } from '../integrations/webhook-dispatcher.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallets/wallet.service';
import { PlatformFeeService } from '../wallets/platform-fee.service';
export declare class PaymentsService {
    private readonly prisma;
    private readonly notifications;
    private readonly wallets;
    private readonly platformFees;
    private readonly webhooks;
    constructor(prisma: PrismaService, notifications: NotificationsService, wallets: WalletService, platformFees: PlatformFeeService, webhooks: WebhookDispatcherService);
    private readonly paymentSelect;
    deposit(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        amount: number;
        currency: PaymentCurrency;
        allowLedgerOnly?: boolean;
    }): Promise<{
        amount: number;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        projectId: string;
        payerId: string;
        payeeId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
    }>;
    depositFromPsp(input: {
        requesterId: string;
        projectId: string;
        amount: number;
        currency: PaymentCurrency;
    }): Promise<{
        amount: number;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        projectId: string;
        payerId: string;
        payeeId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
    }>;
    release(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
    }): Promise<{
        amount: number;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        projectId: string;
        payerId: string;
        payeeId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
    }>;
}
