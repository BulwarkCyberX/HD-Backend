import { IsOptional, IsString } from 'class-validator';

export class UploadAttachmentDto {
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
