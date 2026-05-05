import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateBidDto {
  @IsString()
  @MinLength(1)
  projectId!: string;

  @IsString()
  @MinLength(20)
  proposal!: string;

  @IsNumber()
  @Min(1)
  price!: number;

  @IsString()
  @MinLength(2)
  timeline!: string;
}
