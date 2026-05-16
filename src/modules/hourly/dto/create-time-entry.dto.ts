import { IsDateString, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateTimeEntryDto {
  @IsString()
  @MinLength(1)
  engagementId!: string;

  @IsDateString()
  workDate!: string;

  @IsNumber()
  @Min(0.25)
  hours!: number;

  @IsString()
  @MinLength(3)
  description!: string;
}
