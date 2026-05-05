import { PrismaService } from '../../prisma/prisma.service';
export declare class MessagesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private assertProjectParticipant;
    create(input: {
        projectId: string;
        senderId: string;
        message: string;
    }): Promise<{
        message: string;
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
        sender: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        senderId: string;
    }>;
    listByProject(input: {
        projectId: string;
        requesterId: string;
    }): Promise<{
        message: string;
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
        sender: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        senderId: string;
    }[]>;
}
