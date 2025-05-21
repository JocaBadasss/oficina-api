import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateFullServiceOrderDto } from './dto/CreateFullServiceOrderDto';
import {
  FuelLevel,
  AdblueLevel,
  TireStatus,
  MirrorStatus,
  PaintingStatus,
} from './dto/create-service-order.dto';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

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
      throw new ConflictException({
        code: 'ORDER_ALREADY_EXISTS',
        field: 'vehicleId',
        message: 'Já existe uma ordem em andamento para este veículo.',
      });
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      include: { client: true },
    });

    if (!vehicle) {
      throw new NotFoundException({
        code: 'VEHICLE_NOT_FOUND',
        field: 'vehicleId',
        message: 'Veículo não encontrado para esta ordem de serviço.',
      });
    }

    const serviceOrder = await this.prisma.serviceOrder.create({
      data,
    });

    // 🚨 Dispara notificação automática
    const phone = vehicle.client?.phone;
    if (!phone) {
      throw new ConflictException({
        code: 'MISSING_PHONE',
        field: 'client.phone',
        message:
          'Cliente não possui número de telefone cadastrado para envio de notificação.',
      });
    }

    const message = `🚗 O veículo ${vehicle.plate} teve uma nova ordem de serviço criada.\n\nAcompanhe o andamento nesse link:\n\nhttps://app.oficina.com/acompanhamento/${serviceOrder.id}`;

    await this.notificationsService.createAuto(serviceOrder.id, message);

    return serviceOrder;
  }

  findAll() {
    return this.prisma.serviceOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            year: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            year: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        field: 'id',
        message: 'Ordem de serviço não encontrada.',
      });
    }

    return order;
  }

  async update(id: string, data: UpdateServiceOrderDto) {
    const existingOrder = await this.findOne(id);

    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data,
    });

    if (data.status && data.status !== existingOrder.status) {
      const formattedStatus = data.status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, (l) => l.toUpperCase());

      const msg = `🔧 O status da ordem foi alterado para: ${formattedStatus}`;
      await this.notificationsService.createAuto(id, msg);
    }

    return updatedOrder;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.serviceOrder.delete({
      where: { id },
    });
  }

  async createFull(dto: CreateFullServiceOrderDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let clientId = dto.clientId?.trim();

        // 🔹 1. Criar cliente, se necessário
        if (!clientId) {
          const { name, email, phone, cpfOrCnpj, address } = dto;

          if (!name || !email || !phone || !cpfOrCnpj) {
            throw new BadRequestException({
              code: 'INCOMPLETE_CLIENT_DATA',
              message: 'Nome, e-mail, telefone e CPF/CNPJ são obrigatórios.',
            });
          }

          const rawCpfOrCnpj = cpfOrCnpj.replace(/\D/g, '');

          const existingClient = await tx.client.findUnique({
            where: { cpfOrCnpj: rawCpfOrCnpj },
          });

          if (existingClient) {
            clientId = existingClient.id;
          } else {
            const createdClient = await tx.client.create({
              data: {
                name,
                email,
                phone,
                address,
                cpfOrCnpj: rawCpfOrCnpj,
              },
            });

            clientId = createdClient.id;
          }
        } else {
          // Verifica se clientId enviado realmente existe
          const clientExists = await tx.client.findUnique({
            where: { id: clientId },
          });

          if (!clientExists) {
            throw new BadRequestException({
              code: 'INVALID_RELATION',
              field: 'clientId',
              message: 'Cliente não encontrado.',
            });
          }
        }

        // 🔹 2. Criar veículo, se necessário
        let vehicleId = dto.vehicleId?.trim();

        if (!vehicleId) {
          if (!dto.plate) {
            throw new BadRequestException({
              code: 'MISSING_PLATE',
              field: 'plate',
              message: 'Placa do veículo é obrigatória.',
            });
          }

          const plate = dto.plate.replace('-', '').toUpperCase().trim();

          const existingVehicle = await tx.vehicle.findUnique({
            where: { plate },
          });

          if (existingVehicle) {
            throw new ConflictException({
              code: 'DUPLICATE_PLATE',
              field: 'plate',
              message: 'Esta placa já está cadastrada em outro cliente.',
            });
          }

          const vehicle = await tx.vehicle.create({
            data: {
              plate,
              brand: dto.brand,
              model: dto.model,
              year: dto.year,
              clientId,
            },
          });

          vehicleId = vehicle.id;
        } else {
          const vehicleExists = await tx.vehicle.findUnique({
            where: { id: vehicleId },
          });

          if (!vehicleExists) {
            throw new NotFoundException({
              code: 'VEHICLE_NOT_FOUND',
              field: 'vehicleId',
              message: 'Veículo não encontrado.',
            });
          }
        }

        // 🔹 3. Criar ordem de serviço
        const existingOpenOrder = await tx.serviceOrder.findFirst({
          where: {
            vehicleId,
            status: {
              in: ['AGUARDANDO', 'EM_ANDAMENTO'],
            },
          },
        });

        if (existingOpenOrder) {
          throw new ConflictException({
            code: 'ORDER_ALREADY_EXISTS',
            field: 'vehicleId',
            message: 'Já existe uma ordem em andamento para este veículo.',
          });
        }

        const order = await tx.serviceOrder.create({
          data: {
            vehicleId,
            complaints: dto.complaints,
            ...(dto.notes && { notes: dto.notes }),
            ...(dto.km !== undefined && { km: dto.km }),
            ...(dto.fuelLevel && { fuelLevel: dto.fuelLevel as FuelLevel }),
            ...(dto.adblueLevel && {
              adblueLevel: dto.adblueLevel as AdblueLevel,
            }),
            ...(dto.tireStatus && { tireStatus: dto.tireStatus as TireStatus }),
            ...(dto.mirrorStatus && {
              mirrorStatus: dto.mirrorStatus as MirrorStatus,
            }),
            ...(dto.paintingStatus && {
              paintingStatus: dto.paintingStatus as PaintingStatus,
            }),
          },
        });

        // Notificação (mesma lógica da rota padrão)
        const vehicle = await tx.vehicle.findUnique({
          where: { id: vehicleId },
          include: { client: true },
        });

        if (!vehicle?.client?.phone) {
          throw new ConflictException({
            code: 'MISSING_PHONE',
            field: 'client.phone',
            message:
              'Cliente não possui número de telefone cadastrado para envio de notificação.',
          });
        }

        const message = `🚗 O veículo ${vehicle.plate} teve uma nova ordem de serviço criada.\n\nAcompanhe o andamento nesse link:\n\nhttps://app.oficina.com/acompanhamento/${order.id}`;

        await this.notificationsService.createAuto(order.id, message);

        return {
          message: 'Atendimento criado com sucesso.',
          orderId: order.id,
        };
      });
    } catch (error) {
      console.error('Erro inesperado em /service-orders/full', error);

      // Se já for um HttpException, apenas relança
      if (error instanceof HttpException) {
        throw error;
      }

      // Caso contrário, erro genérico
      throw new InternalServerErrorException(
        'Erro inesperado. Tente novamente.',
      );
    }
  }
}
