import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  ParseUUIDPipe,
  ParseUUIDPipeOptions,
  HttpStatus,
} from '@nestjs/common';
import { ServiceReportsService } from './service-reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { uploadConfig } from 'src/photos/upload.config';

const options: ParseUUIDPipeOptions = {
  exceptionFactory: () =>
    new HttpException('orderId inválido', HttpStatus.BAD_REQUEST),
};
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('service-reports/:orderId')
export class ServiceReportsController {
  constructor(private reportsService: ServiceReportsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 6, uploadConfig))
  async createAndFinalize(
    @Param('orderId', new ParseUUIDPipe(options))
    orderId: string,
    @Body() dto: CreateServiceReportDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      return this.reportsService.createAndFinalize(orderId, dto, files);
    } catch (err) {
      // propaga erros HTTP corretamente
      if (err instanceof HttpException) throw err;
      throw new HttpException('Erro interno', 500);
    }
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
