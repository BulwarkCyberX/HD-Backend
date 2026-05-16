import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewKycDto {
  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
