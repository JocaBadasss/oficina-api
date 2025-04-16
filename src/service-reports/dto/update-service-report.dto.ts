import { IsOptional, IsString } from 'class-validator';

export class UpdateServiceReportDto {
  @IsOptional()
  @IsString({ message: 'description deve ser uma string (se fornecido)' })
  description?: string;
}
