import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddDisputeEvidenceDto {
  @IsString()
  fileAssetId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
