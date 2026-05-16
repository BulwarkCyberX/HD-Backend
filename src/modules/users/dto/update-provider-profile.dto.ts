import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;

  @IsOptional()
  portfolio?: unknown;

  @IsOptional()
  @IsIn(['AVAILABLE', 'BUSY', 'UNAVAILABLE'])
  availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];
}
