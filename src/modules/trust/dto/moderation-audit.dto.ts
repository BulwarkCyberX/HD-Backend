import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ModerationAuditDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  action!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  targetType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  targetId!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
