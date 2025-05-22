import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) {}

  async create(
    filename: string,
    path: string,
    orderId: string,
    prisma: Prisma.TransactionClient | PrismaClient = this.prisma,
  ) {
    // 🔒 Garante que a ordem existe antes de salvar a foto
    const orderExists = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
    });

    if (!orderExists) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        field: 'orderId',
        message: 'Ordem de serviço não encontrada para associar a foto.',
      });
    }

    return prisma.photo.create({
      data: {
        filename,
        path,
        orderId,
      },
    });
  }

  async findByOrderId(orderId: string) {
    // ✅ Retorna [] se não tiver nenhuma foto (pra galeria não quebrar)
    return this.prisma.photo.findMany({
      where: { orderId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
