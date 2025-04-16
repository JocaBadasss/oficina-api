import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceOrderDto } from './create-service-order.dto';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  status?: 'AGUARDANDO' | 'EM_ANDAMENTO' | 'FINALIZADO';
}
