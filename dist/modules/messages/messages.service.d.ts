import { PrismaService } from '../../prisma/prisma.service';
import { DomainEventsService } from '../realtime/domain-events.service';
export declare class MessagesService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: DomainEventsService);
    private assertProjectParticipant;
    create(input: {
        projectId: string;
        senderId: string;
        message: string;
    }): Promise<{
        message: string;
        sender: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        id: string;
        createdAt: Date;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        senderId: string;
    }>;
    listByProject(input: {
        projectId: string;
        requesterId: string;
    }): Promise<{
        message: string;
        sender: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        id: string;
        createdAt: Date;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        senderId: string;
    }[]>;
}
