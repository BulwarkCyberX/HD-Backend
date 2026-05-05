import { IsString, MinLength } from 'class-validator';

export class ReleasePaymentDto {
  @IsString()
  @MinLength(1)
  projectId!: string;
}
