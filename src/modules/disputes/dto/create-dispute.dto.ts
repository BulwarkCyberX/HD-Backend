import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { DisputeCategory } from '@prisma/client';

export class CreateDisputeDto {
  @IsString()
  @MinLength(1)
  projectId!: string;

  @IsEnum(DisputeCategory)
  category!: DisputeCategory;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(8000)
  description!: string;
}
