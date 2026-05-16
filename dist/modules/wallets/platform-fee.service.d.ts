import { PrismaService } from '../../prisma/prisma.service';
export declare class PlatformFeeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActiveFeeBps(): Promise<{
        clientFeeBps: number;
        providerFeeBps: number;
    }>;
}
