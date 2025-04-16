import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';

@Injectable()
export class ServiceReportsService {
  constructor(private prisma: PrismaService) {}

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
    await this.prisma.serviceOrder.update({
      where: { id: data.orderId },
      data: { status: 'FINALIZADO' },
    });

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
