import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/, { message: 'Code must be 6 digits' })
  code!: string;
}
