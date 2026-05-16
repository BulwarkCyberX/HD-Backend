import { IsString, MaxLength, MinLength } from 'class-validator';

export class AiDuplicateDto {
  @IsString()
  @MinLength(10)
  @MaxLength(12000)
  a!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(12000)
  b!: string;
}
