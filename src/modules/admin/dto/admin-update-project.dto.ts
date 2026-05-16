import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BudgetType, ProjectStatus, ProjectVisibility } from '@prisma/client';

export class AdminUpdateProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @IsOptional()
  @IsEnum(BudgetType)
  budgetType?: BudgetType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsString()
  testingWindow?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inScope?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  outOfScope?: string[];

  @IsOptional()
  @IsString()
  selectedProviderId?: string | null;
}
