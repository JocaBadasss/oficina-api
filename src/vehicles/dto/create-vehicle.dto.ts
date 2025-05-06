import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  clientId!: string;

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
