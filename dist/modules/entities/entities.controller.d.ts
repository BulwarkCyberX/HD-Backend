import { type RequestUser } from '../../auth/current-user.decorator';
import { CreateEntityDto } from './dto/create-entity.dto';
import { EntitiesService } from './entities.service';
export declare class EntitiesController {
    private readonly entities;
    constructor(entities: EntitiesService);
    create(user: RequestUser, dto: CreateEntityDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        type: import(".prisma/client").$Enums.EntityType;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
    }>;
}
