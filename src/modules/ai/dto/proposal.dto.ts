import { IsString, MaxLength, MinLength } from 'class-validator';

export class AiProposalDto {
  @IsString()
  @MinLength(20)
  @MaxLength(50000)
  proposal!: string;
}
