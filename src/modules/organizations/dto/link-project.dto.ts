import { IsString } from 'class-validator';

export class LinkProjectDto {
  @IsString()
  projectId!: string;
}
