import { IsIn } from 'class-validator';
import { BidStatus } from '@prisma/client';

export class UpdateBidStatusDto {
  @IsIn([BidStatus.ACCEPTED, BidStatus.REJECTED])
  status!: 'ACCEPTED' | 'REJECTED';
}
