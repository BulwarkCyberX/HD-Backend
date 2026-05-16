import { type RequestUser } from '../../auth/current-user.decorator';
import { CreateVdpDto } from './dto/create-vdp.dto';
import { VdpReportDto } from './dto/vdp-report.dto';
import { VdpService } from './vdp.service';
export declare class VdpController {
    private readonly vdp;
    constructor(vdp: VdpService);
    create(user: RequestUser, dto: CreateVdpDto): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        clientId: string;
        policy: string;
    }>;
    getById(id: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        policy: string;
    }>;
    submitReport(dto: VdpReportDto): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        severity: import(".prisma/client").$Enums.ReportSeverity | null;
        vdpId: string;
        contactEmail: string | null;
    }>;
}
