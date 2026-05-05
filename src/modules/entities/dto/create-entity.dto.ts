import { EntityType } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateEntityDto {
  @IsEnum(EntityType)
  type!: EntityType;

  @IsString()
  @MinLength(2)
  name!: string;
}

