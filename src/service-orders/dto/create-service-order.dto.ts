import { IsEnum, IsOptional, IsString, IsUUID, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

// Enums
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

export enum ServiceStatus {
  AGUARDANDO = 'AGUARDANDO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  FINALIZADO = 'FINALIZADO',
}

// Helper para transformar string vazia em undefined
function transformEmptyToUndefined<T>() {
  return ({ value }: { value: string }) =>
    value === '' ? undefined : (value as T);
}

export function transformToInt() {
  return ({ value }: { value: string }) =>
    value === '' ? undefined : parseInt(value, 10);
}

// DTO principal
export class CreateServiceOrderDto {
  @IsUUID(undefined, { message: 'vehicleId deve ser um UUID válido' })
  vehicleId!: string;

  @IsOptional()
  @Transform(transformEmptyToUndefined<FuelLevel>())
  @IsEnum(FuelLevel, {
    message:
      'fuelLevel deve ser um dos seguintes: RESERVA, QUARTO, METADE, TRES_QUARTOS, CHEIO',
  })
  fuelLevel?: FuelLevel;

  @IsOptional()
  @Transform(transformEmptyToUndefined<AdblueLevel>())
  @IsEnum(AdblueLevel, {
    message:
      'adblueLevel deve ser um dos seguintes: VAZIO, BAIXO, METADE, CHEIO',
  })
  adblueLevel?: AdblueLevel;

  @IsOptional()
  @Transform(transformToInt())
  @IsInt({ message: 'km deve ser um número inteiro' })
  km?: number;

  @IsOptional()
  @Transform(transformEmptyToUndefined<TireStatus>())
  @IsEnum(TireStatus, {
    message: 'tireStatus deve ser: RUIM, REGULAR, BOM ou NOVO',
  })
  tireStatus?: TireStatus;

  @IsOptional()
  @Transform(transformEmptyToUndefined<MirrorStatus>())
  @IsEnum(MirrorStatus, {
    message: 'mirrorStatus deve ser: OK, QUEBRADO, RACHADO ou FALTANDO',
  })
  mirrorStatus?: MirrorStatus;

  @IsOptional()
  @Transform(transformEmptyToUndefined<PaintingStatus>())
  @IsEnum(PaintingStatus, {
    message:
      'paintingStatus deve ser: INTACTA, ARRANHADA, AMASSADA ou REPARADA',
  })
  paintingStatus?: PaintingStatus;

  @IsString({ message: 'complaints deve ser uma string (se fornecido)' })
  complaints!: string;

  @IsOptional()
  @Transform(transformEmptyToUndefined<string>())
  @IsString({ message: 'notes deve ser uma string (se fornecido)' })
  notes?: string;
}
