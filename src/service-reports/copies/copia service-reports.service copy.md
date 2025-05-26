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
      throw new ConflictException(
        'Essa ordem de serviço já possui um relatório.',
      );
    }

    // Cria o relatório
    const report = await this.prisma.serviceReport.create({ data });

    // Atualiza a OS vinculada para FINALIZADO
    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id: data.orderId },
      data: { status: 'FINALIZADO' },
      include: {
        vehicle: true, // 👈 precisamos disso pra pegar a placa
      },
    });

    // 🔔 Notificação complementar com a placa
    const msg = `📋 O serviço do veículo ${updatedOrder.vehicle.plate} foi finalizado.\n \nConfira o laudo completo: \n https://app.oficina.com/acompanhamento/${data.orderId}`;

    await this.notificationsService.createAuto(data.orderId, msg);

    return report;
  }

  async findByOrderId(orderId: string) {
    const report = await this.prisma.serviceReport.findUnique({
      where: { orderId },
    });

    if (!report) {
      throw new NotFoundException('Relatório não encontrado para esta OS.');
    }

    return report;
  }

  async update(orderId: string, data: UpdateServiceReportDto) {
    const report = await this.prisma.serviceReport.findUnique({
      where: { orderId },
    });

    if (!report) {
      throw new NotFoundException('Relatório não encontrado para esta OS.');
    }

    return this.prisma.serviceReport.update({
      where: { orderId },
      data,
    });
  }
}
