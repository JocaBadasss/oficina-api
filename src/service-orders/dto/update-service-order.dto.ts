import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceOrderDto } from './create-service-order.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ServiceStatus } from './create-service-order.dto'; // 👈 importa do mesmo arquivo

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @IsOptional()
  @IsEnum(ServiceStatus, {
    message: 'status deve ser: AGUARDANDO, EM_ANDAMENTO ou FINALIZADO',
  })
  status?: ServiceStatus;
}
