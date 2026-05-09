import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyLoginCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(4, 12)
  code!: string;
}

