import { IsString, MinLength } from 'class-validator';

export class CreateServiceReportDto {
  @IsString({ message: 'description deve ser uma string' })
  @MinLength(1, { message: 'description não pode ficar vazio' })
  description!: string;
}
