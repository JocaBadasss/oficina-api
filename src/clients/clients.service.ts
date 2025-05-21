import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateClientDto) {
    const existingCpfOrCnpj = await this.prisma.client.findUnique({
      where: { cpfOrCnpj: data.cpfOrCnpj },
    });

    if (existingCpfOrCnpj) {
      throw new BadRequestException({
        code: 'DUPLICATE_FIELD',
        field: 'cpfOrCnpj',
        message: 'Já existe um cliente com este CPF ou CNPJ.',
      });
    }

    const existingEmail = await this.prisma.client.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new BadRequestException({
        code: 'DUPLICATE_FIELD',
        field: 'email',
        message: 'Já existe um cliente com este e-mail.',
      });
    }

    const existingPhone = await this.prisma.client.findUnique({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new BadRequestException({
        code: 'DUPLICATE_FIELD',
        field: 'phone',
        message: 'Já existe um cliente com este telefone.',
      });
    }

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
    await this.findOne(id); // valida se o cliente existe

    if (data.cpfOrCnpj) {
      const existingCpfOrCnpj = await this.prisma.client.findUnique({
        where: { cpfOrCnpj: data.cpfOrCnpj },
      });

      if (existingCpfOrCnpj && existingCpfOrCnpj.id !== id) {
        throw new BadRequestException({
          code: 'DUPLICATE_FIELD',
          field: 'cpfOrCnpj',
          message: 'Já existe um cliente com este CPF ou CNPJ.',
        });
      }
    }

    if (data.email) {
      const existingEmail = await this.prisma.client.findUnique({
        where: { email: data.email },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new BadRequestException({
          code: 'DUPLICATE_FIELD',
          field: 'email',
          message: 'Já existe um cliente com este e-mail.',
        });
      }
    }

    if (data.phone) {
      const existingPhone = await this.prisma.client.findFirst({
        where: { phone: data.phone },
      });

      if (existingPhone && existingPhone.id !== id) {
        throw new BadRequestException({
          code: 'DUPLICATE_FIELD',
          field: 'phone',
          message: 'Já existe um cliente com este telefone.',
        });
      }
    }

    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // valida se o cliente existe

    const hasVehicles = await this.prisma.vehicle.findFirst({
      where: { clientId: id },
    });

    if (hasVehicles) {
      throw new BadRequestException({
        code: 'CLIENT_IN_USE',
        field: 'id',
        message:
          'Este cliente possui veículos cadastrados e não pode ser removido.',
      });
    }

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

  async createFromAppointment(data: {
    name: string;
    phone: string;
    cpfOrCnpj: string;
  }) {
    const existing = await this.prisma.client.findFirst({
      where: {
        cpfOrCnpj: data.cpfOrCnpj,
      },
    });

    if (existing) return existing;

    const fakeEmail = `${data.phone.replace(/\D/g, '')}@auto.fake`;

    return this.prisma.client.create({
      data: {
        name: data.name,
        phone: data.phone,
        cpfOrCnpj: data.cpfOrCnpj,
        email: fakeEmail,
        address: '-',
      },
    });
  }
}
