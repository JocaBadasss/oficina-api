import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('appointments')
@UseGuards(JwtAuthGuard, AdminGuard) // só admins acessam
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  // INDEX
  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  // SHOW
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  // UPDATE
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  // DELETE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  // HORÁRIOS DISPONÍVEIS PARA UM DIA
  @Get('available/hours')
  getAvailableSlots(@Query('date') date: string) {
    return this.appointmentsService.getAvailableSlots(date);
  }

  @Post(':id/convert')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async convertToOrder(@Param('id') id: string) {
    return this.appointmentsService.convertToOrder(id);
  }
}
