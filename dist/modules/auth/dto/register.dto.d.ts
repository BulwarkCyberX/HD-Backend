import { UserRole } from '@prisma/client';
export declare class RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country: string;
    city: string;
    state: string;
    postalCode: string;
    role?: UserRole;
}
