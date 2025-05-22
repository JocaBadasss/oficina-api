import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Matches,
  IsInt,
} from 'class-validator';
import { IsValidPlate } from 'src/validators/isValidPlate';
import { transformToInt } from './create-service-order.dto';

export class CreateFullServiceOrderDto {
  // CLIENTE
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Matches(/^\d{11}$|^\d{14}$/, {
    message: 'cpfOrCnpj deve conter 11 ou 14 dígitos numéricos',
  })
  cpfOrCnpj?: string;

  // VEÍCULO
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsValidPlate()
  @IsOptional()
  plate?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  // OS
  @IsNotEmpty()
  @IsString()
  complaints!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(transformToInt())
  @IsInt({ message: 'km deve ser um número inteiro' })
  km?: number;

  @IsOptional()
  @IsString()
  fuelLevel?: string;

  @IsOptional()
  @IsString()
  adblueLevel?: string;

  @IsOptional()
  @IsString()
  tireStatus?: string;

  @IsOptional()
  @IsString()
  mirrorStatus?: string;

  @IsOptional()
  @IsString()
  paintingStatus?: string;
}
