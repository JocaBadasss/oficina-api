import { IsUUID, IsString } from 'class-validator';

export class CreateServiceReportDto {
  @IsUUID(undefined, { message: 'orderId deve ser um UUID válido' })
  orderId!: string;

  @IsString({ message: 'description deve ser uma string' })
  description!: string;
}
