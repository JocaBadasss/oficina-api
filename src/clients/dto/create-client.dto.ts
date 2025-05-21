import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEmail,
  Length,
  Matches,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  name!: string;

  @Transform(({ value }) => (value as string).replace(/\D/g, ''))
  @Matches(/^(\d{11}|\d{14})$/, {
    message: 'CPF ou CNPJ deve conter 11 ou 14 dígitos numéricos',
  })
  cpfOrCnpj!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 20)
  phone!: string;

  @IsOptional()
  @IsString()
  address!: string;
}
