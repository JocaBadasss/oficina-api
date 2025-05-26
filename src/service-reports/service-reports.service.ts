import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PhotosService } from 'src/photos/photos.service';

@Injectable()
export class ServiceReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private photosService: PhotosService,
  ) {}

  async createAndFinalize(
    orderId: string,
    data: CreateServiceReportDto,
    files: Express.Multer.File[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.serviceReport.findUnique({
        where: { orderId },
      });

      if (existing) {
        throw new ConflictException({
          code: 'REPORT_ALREADY_EXISTS',
          field: 'orderId',
          message: 'Essa ordem de serviço já possui um relatório.',
        });
      }

      const order = await tx.serviceOrder.findUnique({
        where: { id: orderId },
        include: { vehicle: true },
      });

      if (!order) {
        throw new NotFoundException({
          code: 'ORDER_NOT_FOUND',
          field: 'orderId',
          message: 'Ordem de serviço não encontrada.',
        });
      }

      await tx.serviceOrder.update({
        where: { id: orderId },
        data: { status: 'FINALIZADO' },
      });

      // Cria o relatório
      const report = await tx.serviceReport.create({
        data: {
          ...data,
          orderId,
        },
      });

      for (const file of files) {
        await this.photosService.create(file.filename, file.path, orderId, tx);
      }

      // 🔔 Notificação com fallback pra placa desconhecida
      const plate = order.vehicle?.plate ?? 'placa não informada';
      const msg = `📋 O serviço do veículo ${plate} foi finalizado.\n\nConfira o laudo completo:\n${process.env.APP_URL}/acompanhamento/${orderId}`;

      await this.notificationsService.createAuto(orderId, msg);

      return report;
    });
  }

  async findByOrderId(orderId: string) {
    const report = await this.prisma.serviceReport.findUnique({
      where: { orderId },
    });

    if (!report) {
      throw new NotFoundException({
        code: 'REPORT_NOT_FOUND',
        field: 'orderId',
        message: 'Relatório não encontrado para esta ordem de serviço.',
      });
    }

    return report;
  }

  async update(orderId: string, data: UpdateServiceReportDto) {
    const report = await this.prisma.serviceReport.findUnique({
      where: { orderId },
    });

    if (!report) {
      throw new NotFoundException({
        code: 'REPORT_NOT_FOUND',
        field: 'orderId',
        message: 'Relatório não encontrado para esta ordem de serviço.',
      });
    }

    return this.prisma.serviceReport.update({
      where: { orderId },
      data,
    });
  }
}
