import { type RequestUser } from '../../auth/current-user.decorator';
import { WalletService } from './wallet.service';
export declare class WalletsController {
    private readonly wallets;
    constructor(wallets: WalletService);
    me(user: RequestUser): Promise<{
        availableBalance: string;
        pendingBalance: string;
        escrowBalance: string;
        lifetimeEarnings: string;
        totalSpent: string;
        currency: "INR";
        updatedAt: Date | null;
    } | {
        availableBalance: string;
        pendingBalance: string;
        escrowBalance: string;
        lifetimeEarnings: string;
        totalSpent: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
    }>;
}
