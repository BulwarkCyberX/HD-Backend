import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVdpDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsNotEmpty()
  scope!: unknown;

  @IsString()
  @MaxLength(50000)
  policy!: string;
}
