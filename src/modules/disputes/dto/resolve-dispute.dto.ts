import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsIn(['UNDER_REVIEW', 'RESOLVED', 'REFUNDED', 'REJECTED'])
  status!: 'UNDER_REVIEW' | 'RESOLVED' | 'REFUNDED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  resolution?: string;
}
