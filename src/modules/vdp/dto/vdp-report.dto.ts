import { ReportSeverity } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class VdpReportDto {
  @IsString()
  vdpId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(50000)
  description!: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsEnum(ReportSeverity)
  severity?: ReportSeverity;
}
