import { UserRole, type PaymentCurrency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PaymentsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private readonly paymentSelect;
    deposit(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        amount: number;
        currency: PaymentCurrency;
    }): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        projectId: string;
        payerId: string;
        payeeId: string;
        amount: number;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
    }>;
    release(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        projectId: string;
        payerId: string;
        payeeId: string;
        amount: number;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
    }>;
}
