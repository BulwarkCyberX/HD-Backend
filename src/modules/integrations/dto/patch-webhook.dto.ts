import { IsBoolean } from 'class-validator';

export class PatchWebhookDto {
  @IsBoolean()
  enabled!: boolean;
}
