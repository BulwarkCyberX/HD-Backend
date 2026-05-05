import { IsEmail, IsString } from 'class-validator';

export class VdpAttachDto {
  @IsString()
  vdpSubmissionId!: string;

  @IsEmail()
  contactEmail!: string;
}
