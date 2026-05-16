import { IsString, Length, Matches } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @Length(10, 10)
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, { message: 'Invalid PAN format' })
  panNumber!: string;

  @IsString()
  @Length(2, 120)
  panHolderName!: string;

  @IsString()
  @Length(8, 18)
  bankAccountNumber!: string;

  @IsString()
  @Length(11, 11)
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i, { message: 'Invalid IFSC format' })
  bankIfsc!: string;

  @IsString()
  @Length(2, 120)
  bankAccountHolder!: string;
}
