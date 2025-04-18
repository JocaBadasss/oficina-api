import { IsUUID, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  vehicleId!: string;

  @IsISO8601()
  date!: string; // usar ISO 8601 (ex: "2025-04-18T14:00:00.000Z")

  @IsOptional()
  @IsString()
  notes?: string;
}
