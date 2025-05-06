import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateVehicleDto) {
    return await this.prisma.vehicle.create({ data });
  }

  async findAll() {
    return await this.prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return vehicle;
  }

  async update(id: string, data: UpdateVehicleDto) {
    // ✅ Validação pra garantir que o ID existe
    await this.findOne(id);
    return await this.prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // ✅ Validação pra garantir que o ID existe
    await this.findOne(id);
    return await this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
