import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DisputeCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  internal?: boolean;
}
