import type { UserRole } from '@prisma/client';
export type RequestUser = {
    userId: string;
    role: UserRole;
};
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
