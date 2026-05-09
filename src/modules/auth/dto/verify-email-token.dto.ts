import { IsString, MinLength } from 'class-validator';

export class VerifyEmailTokenDto {
  @IsString()
  @MinLength(20)
  token!: string;
}
