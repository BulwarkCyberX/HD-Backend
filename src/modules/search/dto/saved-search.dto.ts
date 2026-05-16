import { IsObject, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsObject()
  queryJson!: Record<string, unknown>;
}
