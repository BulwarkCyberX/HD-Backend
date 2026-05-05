import { BugBountyProgramStatus } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  /** Structured scope (JSON object or array from client). */
  @IsNotEmpty()
  scope!: unknown;

  /** Reward tiers / amounts (JSON). */
  @IsNotEmpty()
  rewardTable!: unknown;

  @IsOptional()
  @IsEnum(BugBountyProgramStatus)
  status?: BugBountyProgramStatus;

  /** User ids of invited researchers (providers). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedResearcherIds?: string[];
}
