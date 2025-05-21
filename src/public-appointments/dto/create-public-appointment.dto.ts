import { Transform } from 'class-transformer';
import {
  IsString,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Matches,
} from 'class-validator';

export class CreatePublicAppointmentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @Transform(({ value }) => (value as string).replace(/\D/g, ''))
  @Matches(/^(\d{11}|\d{14})$/, {
    message: 'CPF ou CNPJ deve conter 11 ou 14 dígitos numéricos',
  })
  cpfOrCnpj!: string;

  @IsString()
  @IsNotEmpty()
  plate!: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsInt()
  year!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
