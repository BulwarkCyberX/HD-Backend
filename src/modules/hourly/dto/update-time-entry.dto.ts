import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateTimeEntryDto {
  @IsOptional()
  @IsDateString()
  workDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  hours?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;
}
