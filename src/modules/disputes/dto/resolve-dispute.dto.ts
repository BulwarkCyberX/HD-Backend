import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsIn(['UNDER_REVIEW', 'RESOLVED', 'REFUNDED', 'REJECTED'])
  status!: 'UNDER_REVIEW' | 'RESOLVED' | 'REFUNDED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  resolution?: string;

  /** When status is REFUNDED, move escrow back to client wallet (default true). */
  @IsOptional()
  @IsBoolean()
  processEscrowRefund?: boolean;
}
