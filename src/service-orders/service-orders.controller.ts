import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  UseGuards,
  UseFilters,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
} from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaExceptionFilter } from '../common/filters/prisma-exception.filter';
import { CreateFullServiceOrderDto } from './dto/CreateFullServiceOrderDto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { uploadConfig } from 'src/photos/upload.config';
import { ServiceOrderStatsDto } from './dto/service-order-stats.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
// @UseFilters(PrismaExceptionFilter)
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private service: ServiceOrdersService) {}

  @Post()
  create(@Body() dto: CreateServiceOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('stats')
  @HttpCode(200)
  findStats(): Promise<ServiceOrderStatsDto> {
    return this.service.getStats();
  }

  @Get('stats/monthly')
  getMonthlyStats() {
    return this.service.getMonthlyStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 6, uploadConfig))
  updateWithPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UpdateServiceOrderDto,
  ) {
    return this.service.updateWithPhotos(id, dto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('/full')
  createFull(@Body() dto: CreateFullServiceOrderDto) {
    return this.service.createFull(dto);
  }

  @Post('with-photos')
  @UseInterceptors(FilesInterceptor('files', 6, uploadConfig))
  async createWithPhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: CreateServiceOrderDto,
  ) {
    return this.service.createWithFiles(body, files);
  }

  @Post('complete')
  @UseInterceptors(FilesInterceptor('files', 6, uploadConfig))
  async createOrderFull(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateFullServiceOrderDto,
  ) {
    return this.service.createOrderFullOptionalEntitiesWithPhotos(dto, files);
  }
}
