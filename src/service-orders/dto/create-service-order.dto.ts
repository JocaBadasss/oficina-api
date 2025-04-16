import { IsEnum, IsOptional, IsString, IsUUID, IsInt } from 'class-validator';

export enum FuelLevel {
  RESERVA = 'RESERVA',
  QUARTO = 'QUARTO',
  METADE = 'METADE',
  TRES_QUARTOS = 'TRES_QUARTOS',
  CHEIO = 'CHEIO',
}

export enum AdblueLevel {
  VAZIO = 'VAZIO',
  BAIXO = 'BAIXO',
  METADE = 'METADE',
  CHEIO = 'CHEIO',
}

export enum TireStatus {
  RUIM = 'RUIM',
  REGULAR = 'REGULAR',
  BOM = 'BOM',
  NOVO = 'NOVO',
}

export enum MirrorStatus {
  OK = 'OK',
  QUEBRADO = 'QUEBRADO',
  RACHADO = 'RACHADO',
  FALTANDO = 'FALTANDO',
}

export enum PaintingStatus {
  INTACTA = 'INTACTA',
  ARRANHADA = 'ARRANHADA',
  AMASSADA = 'AMASSADA',
  REPARADA = 'REPARADA',
}

export class CreateServiceOrderDto {
  @IsUUID(undefined, { message: 'vehicleId deve ser um UUID válido' })
  vehicleId!: string;

  @IsEnum(FuelLevel, {
    message:
      'fuelLevel deve ser um dos seguintes: RESERVA, QUARTO, METADE, TRES_QUARTOS, CHEIO',
  })
  fuelLevel!: FuelLevel;

  @IsEnum(AdblueLevel, {
    message:
      'adblueLevel deve ser um dos seguintes: VAZIO, BAIXO, METADE, CHEIO',
  })
  adblueLevel!: AdblueLevel;

  @IsInt({ message: 'km deve ser um número inteiro' })
  km!: number;

  @IsEnum(TireStatus, {
    message: 'tireStatus deve ser: RUIM, REGULAR, BOM ou NOVO',
  })
  tireStatus!: TireStatus;

  @IsEnum(MirrorStatus, {
    message: 'mirrorStatus deve ser: OK, QUEBRADO, RACHADO ou FALTANDO',
  })
  mirrorStatus!: MirrorStatus;

  @IsEnum(PaintingStatus, {
    message:
      'paintingStatus deve ser: INTACTA, ARRANHADA, AMASSADA ou REPARADA',
  })
  paintingStatus!: PaintingStatus;

  @IsOptional()
  @IsString({ message: 'complaints deve ser uma string (se fornecido)' })
  complaints?: string;

  @IsOptional()
  @IsString({ message: 'notes deve ser uma string (se fornecido)' })
  notes?: string;
}
