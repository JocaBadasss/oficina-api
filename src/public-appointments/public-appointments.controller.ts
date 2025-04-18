import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { PublicAppointmentsService } from './public-appointments.service';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';

@Controller('public-appointments')
export class PublicAppointmentsController {
  constructor(
    private readonly publicAppointmentsService: PublicAppointmentsService,
  ) {}

  @Get('available')
  getAvailable(@Query('date') date: string) {
    return this.publicAppointmentsService.getAvailableSlots(date);
  }

  @Post()
  create(@Body() dto: CreatePublicAppointmentDto) {
    return this.publicAppointmentsService.create(dto);
  }
}
