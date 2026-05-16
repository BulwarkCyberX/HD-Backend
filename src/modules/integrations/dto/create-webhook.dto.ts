import { ArrayMinSize, IsArray, IsEnum, IsString, IsUrl, MinLength } from 'class-validator';
import { WebhookEventType } from '@prisma/client';

export class CreateWebhookDto {
  @IsString()
  @MinLength(2)
  label!: string;

  @IsUrl({ require_tld: false })
  url!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(WebhookEventType, { each: true })
  events!: WebhookEventType[];
}
