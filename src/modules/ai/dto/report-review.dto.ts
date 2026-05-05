import { ReportSeverity } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class AiReportReviewDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(50000)
  description!: string;

  @IsEnum(ReportSeverity)
  severity!: ReportSeverity;
}
