import { IsUUID } from 'class-validator';

export class CreatePhotoDto {
  @IsUUID(undefined, { message: 'orderId deve ser um UUID válido' })
  orderId!: string;
}
