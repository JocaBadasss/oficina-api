import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async findOne(orderId: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: {
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
          },
        },
        report: {
          select: {
            description: true,
            createdAt: true,
          },
        },
        photos: {
          select: {
            filename: true,
            path: true,
          },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      fuelLevel: order.fuelLevel,
      adblueLevel: order.adblueLevel,
      km: order.km,
      tireStatus: order.tireStatus,
      mirrorStatus: order.mirrorStatus,
      paintingStatus: order.paintingStatus,
      complaints: order.complaints,
      vehicle: order.vehicle,
      report: order.report,
      photos: order.photos.map((photo) => ({
        filename: photo.filename,
        url: `http://localhost:3000/uploads/${photo.filename}`, // ajusta conforme a URL real
      })),
    };
  }
}
