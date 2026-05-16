import { DisputeCategory } from '@prisma/client';
export declare class CreateDisputeDto {
    projectId: string;
    category: DisputeCategory;
    title: string;
    description: string;
}
