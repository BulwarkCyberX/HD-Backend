import { type RequestUser } from '../../auth/current-user.decorator';
import { DepositPaymentDto } from './dto/deposit-payment.dto';
import { ReleasePaymentDto } from './dto/release-payment.dto';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly payments;
    constructor(payments: PaymentsService);
    deposit(user: RequestUser, dto: DepositPaymentDto): Promise<{
        amount: number;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        projectId: string;
        payerId: string;
        payeeId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
    }>;
    release(user: RequestUser, dto: ReleasePaymentDto): Promise<{
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
