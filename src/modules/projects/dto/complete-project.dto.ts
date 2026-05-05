import { IsBoolean, IsOptional } from 'class-validator';

export class CompleteProjectDto {
  @IsOptional()
  @IsBoolean()
  explicitClientConfirmation?: boolean;
}
