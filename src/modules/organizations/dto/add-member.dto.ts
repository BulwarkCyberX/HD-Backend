import { IsEmail, IsEnum } from 'class-validator';
import { OrganizationMemberRole } from '@prisma/client';

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(OrganizationMemberRole)
  role!: OrganizationMemberRole;
}
