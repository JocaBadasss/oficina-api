import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) {}

  async create(filename: string, path: string, orderId: string) {
    return this.prisma.photo.create({
      data: {
        filename,
        path,
        orderId,
      },
    });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.photo.findMany({
      where: { orderId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
