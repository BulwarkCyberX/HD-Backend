import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ApproveMilestoneDto {
  /** Partial completion: percent of milestone amount to approve (1–100). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  partialPercent?: number;
}
