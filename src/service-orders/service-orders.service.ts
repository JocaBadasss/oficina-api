import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';

@Injectable()
export class ServiceOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateServiceOrderDto) {
    const existingOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: {
          in: ['AGUARDANDO', 'EM_ANDAMENTO'],
        },
      },
    });

    if (existingOrder) {
      throw new ConflictException(
        'Já existe uma ordem em andamento para este veículo.',
      );
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(
        'Veículo não encontrado para esta ordem de serviço',
      );
    }

    return this.prisma.serviceOrder.create({ data });
  }

  findAll() {
    return this.prisma.serviceOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Ordem de serviço não encontrada');
    return order;
  }

  async update(id: string, data: UpdateServiceOrderDto) {
    await this.findOne(id);
    return this.prisma.serviceOrder.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.serviceOrder.delete({
      where: { id },
    });
  }
}
