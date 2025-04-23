import { IsString, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  clientId!: string;

  @IsString()
  message!: string;

  @IsBoolean()
  sent!: boolean;
}
