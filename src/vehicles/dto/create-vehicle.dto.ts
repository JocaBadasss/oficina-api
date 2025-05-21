import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { IsValidPlate } from 'src/validators/isValidPlate';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  clientId!: string;

  @IsValidPlate()
  @IsNotEmpty()
  @IsString()
  plate!: string;

  @IsOptional()
  @IsString()
  brand!: string;

  @IsOptional()
  @IsString()
  model!: string;

  @IsOptional()
  @IsNumber()
  year!: number;
}
