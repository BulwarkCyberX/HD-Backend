import { IsIn, IsString, MinLength } from 'class-validator';

export class TriageReportDto {
  @IsString()
  @IsIn(['VALID', 'REJECTED', 'NEED_MORE_INFO'])
  status!: 'VALID' | 'REJECTED' | 'NEED_MORE_INFO';

  @IsString()
  @MinLength(3)
  triageNotes!: string;
}
