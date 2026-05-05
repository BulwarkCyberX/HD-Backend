import { IsString, MaxLength, MinLength } from 'class-validator';

export class AiScopeDto {
  @IsString()
  @MinLength(10)
  @MaxLength(20000)
  description!: string;
}
