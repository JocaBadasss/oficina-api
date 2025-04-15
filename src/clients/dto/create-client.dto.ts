import { IsOptional, IsString, IsEmail, Length } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 20)
  phone!: string;

  @IsString()
  address!: string;
}
