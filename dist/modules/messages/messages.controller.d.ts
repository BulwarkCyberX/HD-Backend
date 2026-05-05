import { type RequestUser } from '../../auth/current-user.decorator';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messages;
    constructor(messages: MessagesService);
    create(user: RequestUser, dto: CreateMessageDto): Promise<{
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
    listByProject(user: RequestUser, projectId: string): Promise<{
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
