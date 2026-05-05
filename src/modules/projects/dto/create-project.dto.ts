import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BudgetType, ProjectVisibility } from '@prisma/client';

export class ProjectAssetDto {
  @IsString()
  @IsIn(['DOMAIN', 'URL', 'IP'])
  type!: 'DOMAIN' | 'URL' | 'IP';

  @IsString()
  @MinLength(2)
  value!: string;
}

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProjectAssetDto)
  assets!: ProjectAssetDto[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  inScope!: string[];

  @IsArray()
  @IsString({ each: true })
  outOfScope!: string[];

  @IsString()
  @MinLength(3)
  testingWindow!: string;

  @IsEnum(BudgetType)
  budgetType!: BudgetType;

  @IsNumber()
  @Min(1)
  budgetAmount!: number;

  @IsString()
  @MinLength(3)
  timeline!: string;

  @IsEnum(ProjectVisibility)
  visibility!: ProjectVisibility;
}

