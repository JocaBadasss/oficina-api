import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceOrderDto } from './create-service-order.dto';
import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ServiceStatus } from './create-service-order.dto'; // 👈 importa do mesmo arquivo
import { Transform } from 'class-transformer';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @IsOptional()
  @IsEnum(ServiceStatus, {
    message: 'status deve ser: AGUARDANDO, EM_ANDAMENTO ou FINALIZADO',
  })
  status?: ServiceStatus;

  @IsOptional()
  @Transform(
    // anota o retorno como string[]
    ({ value }): string[] => {
      if (value == null) return [];
      // se já veio array, assume que é string[]
      if (Array.isArray(value)) return value as string[];
      // senão embrulha a string única num array
      return [String(value)];
    },
    { toClassOnly: true },
  )
  @IsArray()
  @IsUUID('4', { each: true })
  removePhotoIds?: string[];
}
