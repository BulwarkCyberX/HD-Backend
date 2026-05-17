import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { EnterpriseSsoProtocol } from '@prisma/client';

export class UpsertOrgSsoDto {
  @IsEnum(EnterpriseSsoProtocol)
  protocol!: EnterpriseSsoProtocol;

  @IsBoolean()
  enabled!: boolean;

  @IsUrl({ require_tld: false })
  issuerUrl!: string;

  @IsString()
  @MinLength(2)
  clientId!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  clientSecret?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedEmailDomains?: string[];
}
