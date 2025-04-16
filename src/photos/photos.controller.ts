import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadConfig } from './upload.config';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', uploadConfig))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreatePhotoDto,
  ) {
    return this.photosService.create(file.filename, file.path, body.orderId);
  }

  @Get(':orderId')
  async getByOrder(@Param('orderId') orderId: string) {
    return this.photosService.findByOrderId(orderId);
  }
}
