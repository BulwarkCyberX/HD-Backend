import { IsEnum, IsString, MinLength } from 'class-validator';
import { ReportSeverity } from '@prisma/client';

export class CreateReportDto {
  @IsString()
  @MinLength(1)
  projectId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsEnum(ReportSeverity)
  severity!: ReportSeverity;
}
