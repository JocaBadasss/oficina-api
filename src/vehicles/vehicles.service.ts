import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateVehicleDto) {
    data.plate = data.plate.replace('-', '').toUpperCase();

    if (data.clientId) {
      const clientExists = await this.prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!clientExists) {
        throw new BadRequestException({
          code: 'INVALID_RELATION',
          field: 'clientId',
          message: 'Cliente não encontrado.',
        });
      }
    }

    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plate: data.plate },
    });

    if (existingVehicle) {
      throw new BadRequestException({
        code: 'DUPLICATE_FIELD',
        field: 'plate',
        message: 'Já existe um veículo com essa placa.',
      });
    }

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
    await this.findOne(id);

    if (data.clientId) {
      const clientExists = await this.prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!clientExists) {
        throw new BadRequestException({
          code: 'INVALID_RELATION',
          field: 'clientId',
          message: 'Cliente não encontrado.',
        });
      }
    }

    if (data.plate) {
      data.plate = data.plate.replace('-', '').toUpperCase();

      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { plate: data.plate },
      });

      if (existingVehicle && existingVehicle.id !== id) {
        throw new BadRequestException({
          code: 'DUPLICATE_FIELD',
          field: 'plate',
          message: 'Já existe um veículo com essa placa.',
        });
      }
    }

    return await this.prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const vehicleInUse = await this.prisma.serviceOrder.findFirst({
      where: { vehicleId: id },
    });

    if (vehicleInUse) {
      throw new BadRequestException({
        code: 'VEHICLE_IN_USE',
        field: 'id',
        message:
          'Não é possível remover este veículo, pois está vinculado a uma ordem de serviço.',
      });
    }

    return await this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
