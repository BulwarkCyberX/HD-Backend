import { IsEnum } from 'class-validator';
import { HourlyEngagementStatus } from '@prisma/client';

export class SetEngagementStatusDto {
  @IsEnum(HourlyEngagementStatus)
  status!: HourlyEngagementStatus;
}
