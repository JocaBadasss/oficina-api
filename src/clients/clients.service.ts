import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateClientDto) {
    return this.prisma.client.create({ data });
  }

  findAll() {
    return this.prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async update(id: string, data: UpdateClientDto) {
    await this.findOne(id); // valida se existe
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id); // valida se existe
    return this.prisma.client.delete({ where: { id } });
  }

  async findOrdersByClient(clientId: string) {
    return this.prisma.serviceOrder.findMany({
      where: {
        vehicle: {
          clientId: clientId,
        },
      },
      include: {
        vehicle: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findVehiclesByClient(clientId: string) {
    return this.prisma.vehicle.findMany({
      where: {
        clientId: clientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
