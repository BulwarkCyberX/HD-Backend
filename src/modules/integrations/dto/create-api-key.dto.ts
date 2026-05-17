import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { API_SCOPES } from '../api-scopes';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(2)
  label!: string;

  @IsOptional()
  @IsArray()
  @IsIn(API_SCOPES, { each: true })
  scopes?: string[];
}
