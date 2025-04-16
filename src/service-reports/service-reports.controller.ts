import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { ServiceReportsService } from './service-reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('service-reports')
export class ServiceReportsController {
  constructor(private reportsService: ServiceReportsService) {}

  @Post()
  create(@Body() dto: CreateServiceReportDto) {
    return this.reportsService.create(dto);
  }

  @Get(':orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.reportsService.findByOrderId(orderId);
  }

  @Patch(':orderId')
  update(
    @Param('orderId') orderId: string,
    @Body() body: UpdateServiceReportDto,
  ) {
    return this.reportsService.update(orderId, body);
  }
}
