import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Matches,
} from 'class-validator';
import { IsValidPlate } from 'src/validators/isValidPlate';

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
  @IsNumber()
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
