import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class PresignUploadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  originalName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  workspaceReportId?: string;

  @IsOptional()
  @IsString()
  bugReportId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  vdpSubmissionId?: string;
}
