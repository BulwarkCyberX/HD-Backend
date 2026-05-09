import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'Password must include a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must include an uppercase letter' })
  @Matches(/\d/, { message: 'Password must include a number' })
  @Matches(/[^\w\s]/, { message: 'Password must include a special character' })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  state!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(16)
  postalCode!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

