import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class ServiceReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: CreateServiceReportDto) {
    const existing = await this.prisma.serviceReport.findUnique({
      where: { orderId: data.orderId },
    });

    if (existing) {
      throw new ConflictException({
        code: 'REPORT_ALREADY_EXISTS',
        field: 'orderId',
        message: 'Essa ordem de serviço já possui um relatório.',
      });
    }

    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: data.orderId },
      include: { vehicle: true },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        field: 'orderId',
        message: 'Ordem de serviço não encontrada.',
      });
    }

    // Cria o relatório
    const report = await this.prisma.serviceReport.create({ data });

    // Atualiza a OS vinculada para FINALIZADO
    await this.prisma.serviceOrder.update({
      where: { id: data.orderId },
      data: { status: 'FINALIZADO' },
    });

    // 🔔 Notificação com fallback pra placa desconhecida
    const plate = order.vehicle?.plate ?? 'placa não informada';
    const msg = `📋 O serviço do veículo ${plate} foi finalizado.\n\nConfira o laudo completo:\nhttps://app.oficina.com/acompanhamento/${data.orderId}`;

    await this.notificationsService.createAuto(data.orderId, msg);

    return report;
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
