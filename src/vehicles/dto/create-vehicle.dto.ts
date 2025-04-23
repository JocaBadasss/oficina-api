import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  clientId!: string;

  @IsNotEmpty()
  @IsString()
  plate!: string;

  @IsNotEmpty()
  @IsString()
  brand!: string;

  @IsNotEmpty()
  @IsString()
  model!: string;

  @IsNotEmpty()
  @IsNumber()
  year!: number;
}
