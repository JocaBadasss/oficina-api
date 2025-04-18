import {
  IsString,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreatePublicAppointmentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

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
